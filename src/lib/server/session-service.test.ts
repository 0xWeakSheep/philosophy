import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { DeepSeekLanguageProvider } from "./provider";
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
      "对方每次迟到，我都说没关系，因为我觉得成熟的人不应该计较，但之后会一直生气。",
    );
    expect(created.provider).toBe("local");

    let session = created;
    for (const answer of [
      "我担心说出来以后，对方会觉得我很难相处。",
      "我不能退让的是彼此尊重时间。",
      "我先感到胃里发紧，接着开始解释他为什么迟到。",
      "我沉默是在避免冲突，也希望他自己意识到问题。",
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
          `这是第 ${index + 1} 件反复发生的关系困境，我总是先沉默，再假装自己并不在意。`,
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
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const service = new MirrorSessionService(store, provider);
    const session = await service.create(
      "他临时取消了约定，我很生气，但又觉得成熟的人不该计较这种小事。",
    );

    expect(session.provider).toBe("local");
    expect(session.messages.findLast((message) => message.role === "mirror")?.content).toContain(
      session.marker,
    );
  });
});
