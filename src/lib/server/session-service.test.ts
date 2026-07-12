import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { createLocalSession } from "../domain/engine";
import type { AnswerSuggestion } from "../domain/schemas";
import { DeepSeekLanguageProvider, type MirrorLanguageProvider } from "./provider";
import { MirrorSessionService } from "./session-service";
import { JsonSessionStore } from "./session-store";

const temporaryDirectories: string[] = [];

async function testService(): Promise<{
  readonly service: MirrorSessionService;
  readonly filePath: string;
}> {
  const directory = await mkdtemp(path.join(tmpdir(), "mirror-room-"));
  temporaryDirectories.push(directory);
  const filePath = path.join(directory, "sessions.json");
  const store = new JsonSessionStore(filePath);
  return { service: new MirrorSessionService(store), filePath };
}

afterEach(async () => {
  vi.unstubAllGlobals();
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("MirrorSessionService", () => {
  it("persists the complete session lifecycle without an API key", async () => {
    const { service, filePath } = await testService();
    const created = await service.create(
      "两个人同样努力，却因起点和资源不同得到不同机会。我仍认为人应为选择负责，但结果不能只归因于努力。",
    );
    expect(created.provider).toBe("local");
    const suggestionSet = await service.suggestions(created.id);
    expect(suggestionSet.source).toBe("local");
    expect(suggestionSet.suggestions).toHaveLength(4);

    let session = created;
    for (const answer of [
      "家庭资源、教育机会和制度规则在选择之前已经存在。",
      "物质条件不依赖承认，但公平需要共同理解和制度承诺。",
      "我先看到结果差异，后来才把个人动机放进解释。",
      "我会先改变资源分配和规则，再观察观念是否变化。",
      "规则制定者拥有更大话语权，失败成本往往由资源更少的人承担。",
    ]) {
      session = await service.answer(session.id, answer);
    }

    expect(session.stage).toBe("result");
    const result = await service.getResult(session.id);
    const hypothesis = result.hypotheses[0];
    expect(hypothesis).toBeDefined();
    if (hypothesis === undefined) return;

    session = await service.updateStance(session.id, hypothesis.id, "resonates", undefined);
    expect(session.result?.hypotheses[0]?.stance).toBe("resonates");

    const experiment = await service.experiment(session.id, "field");
    expect(experiment.session.experiments).toHaveLength(1);

    session = await service.submitFeedback(session.id, {
      structureDiscovery: true,
      feltLabeled: false,
    });
    expect(session.stage).toBe("feedback");
    expect(session.feedback?.structureDiscovery).toBe(true);

    const persisted = JSON.parse(await readFile(filePath, "utf8")) as unknown;
    expect(persisted).toMatchObject({ version: 1 });

    await service.delete(session.id);
    await expect(service.get(session.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("serializes concurrent atomic writes", async () => {
    const { service, filePath } = await testService();
    const sessions = await Promise.all(
      Array.from({ length: 8 }, (_, index) =>
        service.create(
          `这是第 ${index + 1} 个世界观判断：我认为个人选择能改变处境，但资源与制度也会限制行动范围。`,
        ),
      ),
    );
    expect(new Set(sessions.map((session) => session.id))).toHaveLength(8);

    const persisted = JSON.parse(await readFile(filePath, "utf8")) as {
      readonly sessions?: Readonly<Record<string, unknown>>;
    };
    expect(Object.keys(persisted.sessions ?? {})).toHaveLength(8);
    expect(await Promise.all(sessions.map((session) => service.get(session.id)))).toHaveLength(8);
  });

  it("falls back to the local engine when DeepSeek is unavailable", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "mirror-room-"));
    temporaryDirectories.push(directory);
    const store = new JsonSessionStore(path.join(directory, "sessions.json"));
    const provider = new DeepSeekLanguageProvider({
      apiKey: "test-key",
      baseUrl: "https://invalid.example",
      model: "deepseek-v4-flash",
      timeoutMs: 20,
    });
    const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);

    const service = new MirrorSessionService(store, provider);
    const session = await service.create(
      "我一直相信只要足够努力就能改变处境，但看到起点不同的人得到完全不同的机会时，我开始怀疑。",
    );

    expect(session.provider).toBe("local");
    expect(session.messages.findLast((message) => message.role === "mirror")?.content).toContain(
      session.marker,
    );

    await service.create("一条新的世界观判断：我相信观念能改变行动，但也承认现实条件会限制选择。");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps the local mirror dimension when a language refinement drifts", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "mirror-room-"));
    temporaryDirectories.push(directory);
    const store = new JsonSessionStore(path.join(directory, "sessions.json"));
    const refineQuestion = vi.fn(async () => ({
      topic: "不应覆盖的议题",
      marker: "不应覆盖的标记",
      question: "哪些因素即使没人承认也会继续存在，哪些又需要共同相信才会成为现实？",
    }));
    const provider = {
      name: "deepseek",
      refineIntake: async () => null,
      refineQuestion,
    } satisfies MirrorLanguageProvider;
    const service = new MirrorSessionService(store, provider);
    let session = await service.create(
      "两个人同样努力，却因资源和规则不同得到不同机会。我仍觉得人该为自己的选择负责。",
    );
    const originalTopic = session.topic;
    const originalMarker = session.marker;

    session = await service.answer(session.id, "资源与制度在选择之前已经存在。");
    expect(session.topic).toBe(originalTopic);
    expect(session.marker).toBe(originalMarker);
    session = await service.answer(session.id, "物质事实不依赖承认，公平则依赖共同理解。");
    session = await service.answer(session.id, "我先看到数据，后来又检查了反例证据。");

    const nextQuestion = session.messages.findLast((message) => message.role === "mirror")?.content;
    expect(nextQuestion).toContain("改变一个变量");
    expect(nextQuestion).not.toContain("即使没人承认");
    expect(refineQuestion).not.toHaveBeenCalled();
  });

  it("hydrates local suggestions for sessions persisted before the field existed", async () => {
    const { service, filePath } = await testService();
    const created = await service.create(
      "我相信个人选择会改变处境，但资源与制度也会限制人能够选择的范围。",
    );
    const persisted = JSON.parse(await readFile(filePath, "utf8")) as {
      sessions: Record<string, { suggestions?: unknown }>;
    };
    const legacySession = persisted.sessions[created.id];
    expect(legacySession).toBeDefined();
    if (legacySession === undefined) return;
    delete legacySession.suggestions;
    await writeFile(filePath, `${JSON.stringify(persisted, null, 2)}\n`, "utf8");

    const hydrated = await service.get(created.id);
    expect(hydrated.suggestions).toHaveLength(4);
    expect(new Set(hydrated.suggestions.map((suggestion) => suggestion.lens)).size).toBe(4);
  });

  it("returns balanced AI suggestions without persisting them into the answer flow", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "mirror-room-"));
    temporaryDirectories.push(directory);
    const store = new JsonSessionStore(path.join(directory, "sessions.json"));
    const dynamicSuggestions = [
      {
        id: "ai-agency",
        lens: "agency",
        content: "我会先看人如何理解机会，因为这种理解会改变接下来的选择。",
      },
      {
        id: "ai-conditions",
        lens: "conditions",
        content: "我会先看资源和规则，因为它们在选择之前已经改变了行动成本。",
      },
      {
        id: "ai-integrated",
        lens: "integrated",
        content: "我认为观念会组织行动，而规则会决定这种行动能否转化为结果。",
      },
      {
        id: "ai-uncertain",
        lens: "uncertain",
        content: "我还需要比较相近条件下的反例，才能判断哪一层更先起作用。",
      },
    ] satisfies AnswerSuggestion[];
    const suggestAnswers = vi.fn(async () => dynamicSuggestions);
    const provider = {
      name: "deepseek",
      refineIntake: async () => null,
      refineQuestion: async () => null,
      suggestAnswers,
    } satisfies MirrorLanguageProvider;
    const service = new MirrorSessionService(store, provider);
    const created = await service.create(
      "我相信选择能改变人的处境，但已有资源和共同观念也会影响机会。",
    );

    const suggestionSet = await service.suggestions(created.id);
    expect(suggestionSet).toEqual({ suggestions: dynamicSuggestions, source: "deepseek" });
    expect(suggestAnswers).toHaveBeenCalledTimes(1);
    expect((await service.get(created.id)).suggestions[0]?.id).toContain("local-1-");
  });

  it("parses a safe DeepSeek suggestion response into four editable answers", async () => {
    const provider = new DeepSeekLanguageProvider({
      apiKey: "test-key",
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-v4-flash",
      timeoutMs: 100,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      suggestions: [
                        { lens: "agency", content: "我会先看理解如何影响人的选择。" },
                        { lens: "conditions", content: "我会先看资源如何限制可选项。" },
                        {
                          lens: "integrated",
                          content: "我认为观念组织行动，条件决定行动能走多远。",
                        },
                        {
                          lens: "uncertain",
                          content: "我还需要更多反例，才能判断哪一层先起作用。",
                        },
                      ],
                    }),
                  },
                },
              ],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
      ),
    );
    const session = createLocalSession("我相信人的选择会改变处境，但资源和规则也会限制行动范围。");
    const question = session.messages.findLast(
      (message) => message.role === "mirror" && message.dimension !== undefined,
    );
    expect(question?.dimension).toBeDefined();
    if (question?.dimension === undefined) return;

    const suggestions = await provider.suggestAnswers({
      topic: session.topic,
      marker: session.marker,
      dimension: question.dimension,
      question: question.content,
      messages: session.messages,
      localSuggestions: session.suggestions,
    });
    expect(suggestions).toHaveLength(4);
    expect(suggestions?.every((suggestion) => suggestion.id.startsWith("ai-"))).toBe(true);
  });
});
