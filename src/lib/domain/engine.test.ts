import { describe, expect, it } from "vitest";

import {
  advanceLocalSession,
  createCounterfactualExperiment,
  createLocalSession,
  updateHypothesisStance,
} from "./engine";

const INTAKE =
  "两个人付出相近的努力，却因为起点和资源不同得到完全不同的机会。我仍觉得人应当为自己的选择负责，但把结果只归因于努力，也不诚实。";

function completeSession() {
  let session = createLocalSession(INTAKE, new Date("2026-07-11T10:00:00.000Z"));
  const answers = [
    "在选择之前，家庭资源、教育机会和社会规则已经分配了不同起点。",
    "资源差异即使没人承认也会起作用，但公平需要共同理解和制度承诺才存在。",
    "我先看到了结果差异，后来相近条件下仍有人作出不同选择，让我保留了个人能动性。",
    "我会先改资源分配和规则，再看观念是否随实际机会变化。",
    "制定规则的人拥有更大话语权，规则失败的成本通常由资源更少的人承担。",
  ];
  answers.forEach((answer, index) => {
    session = advanceLocalSession(session, answer, new Date(`2026-07-11T10:0${index + 1}:00.000Z`));
  });
  return session;
}

describe("mirror domain engine", () => {
  it("creates a local session with one focused first question", () => {
    const session = createLocalSession(INTAKE, new Date("2026-07-11T10:00:00.000Z"));

    expect(session.stage).toBe("topic_confirm");
    expect(session.questionIndex).toBe(0);
    expect(session.totalQuestions).toBe(5);
    expect(session.messages).toHaveLength(2);
    expect(session.messages[1]?.role).toBe("mirror");
    expect(session.messages[1]?.dimension).toBe("field");
    expect(session.marker).toContain("为自己的选择负责");
    expect(session.suggestions).toHaveLength(4);
    expect(new Set(session.suggestions.map((suggestion) => suggestion.lens))).toEqual(
      new Set(["agency", "conditions", "integrated", "uncertain"]),
    );
    expect(session.suggestions.every((suggestion) => suggestion.content.includes("我"))).toBe(true);
  });

  it("finishes after the required answers and binds evidence to user messages", () => {
    const session = completeSession();

    expect(session.stage).toBe("result");
    expect(session.questionIndex).toBe(5);
    expect(session.result?.hypotheses).toHaveLength(3);
    expect(session.result?.hypotheses[0]?.title).toContain("物质条件优先");
    expect(session.result?.dimensions).toHaveLength(4);
    expect(session.result?.uncertainties.length).toBeGreaterThanOrEqual(1);
    expect(session.suggestions).toEqual([]);

    const userIds = new Set(
      session.messages.filter((message) => message.role === "user").map((message) => message.id),
    );
    const nodes = session.result?.hypotheses.flatMap((hypothesis) => [
      ...hypothesis.evidence,
      ...hypothesis.counterEvidence,
    ]);
    expect(nodes?.length).toBeGreaterThanOrEqual(6);
    for (const node of nodes ?? []) {
      expect(userIds.has(node.sourceMessageId)).toBe(true);
      expect(node.quote.length).toBeGreaterThan(0);
    }

    const signals = session.result?.dimensions.map((dimension) => dimension.signal);
    expect(
      signals?.every((signal) => ["order", "conflict", "center", "open"].includes(signal)),
    ).toBe(true);
    expect(new Set(signals).size).toBeGreaterThan(1);
    expect(JSON.stringify(session)).not.toContain("—");
  });

  it("moves to a new single question without duplicating terminal punctuation", () => {
    let session = createLocalSession(INTAKE);
    session = advanceLocalSession(session, "资源与教育机会在选择发生前已经存在。");
    session = advanceLocalSession(session, "物质差异不依赖承认，公平则依赖共同理解。");
    session = advanceLocalSession(session, "我先看到数据差异，后来才想到个人动机。");

    const question = session.messages.findLast((message) => message.role === "mirror")?.content;
    expect(question).toContain("你刚才写到");
    expect(question).not.toContain("。”。");
    expect(session.suggestions).toHaveLength(4);
    expect(session.suggestions.every((suggestion) => suggestion.id.startsWith("local-4-"))).toBe(
      true,
    );
  });

  it("can surface an ideas-first tendency without turning it into a fixed identity", () => {
    let session = createLocalSession(
      "我相信观念决定行动。只要人真正改变想法，现实结果就会跟着改变。",
    );
    for (const answer of [
      "共同观念在个人选择之前已经存在，并影响人怎样理解机会。",
      "意义只有被理解和相信后才会成为现实。",
      "我先看一个人的动机和选择，再看其他证据。",
      "我会先改变观念和意愿，因为行动会随理解发生变化。",
    ]) {
      session = advanceLocalSession(session, answer);
    }

    expect(session.result?.hypotheses[0]?.title).toContain("观念与选择优先");
    expect(session.result?.uncertainties[0]).toContain("只绑定本次议题");
  });

  it("lets the user reject a hypothesis and run a one-variable experiment", () => {
    const session = completeSession();
    const hypothesis = session.result?.hypotheses[0];
    expect(hypothesis).toBeDefined();
    if (hypothesis === undefined) return;

    const revised = updateHypothesisStance(
      session,
      hypothesis.id,
      "counterexample",
      "在相近资源条件下，不同选择仍然稳定地产生了不同结果。",
      new Date("2026-07-11T10:06:00.000Z"),
    );
    expect(revised.result?.hypotheses[0]?.stance).toBe("counterexample");
    expect(revised.result?.hypotheses[0]?.stanceNote).toContain("相近资源条件");

    const created = createCounterfactualExperiment(
      revised,
      "phenomenology",
      new Date("2026-07-11T10:07:00.000Z"),
    );
    expect(created.experiment.changedDimension).toBe("phenomenology");
    expect(created.experiment.before).toContain("证据如何进入判断");
    expect(created.session.experiments).toHaveLength(1);
  });

  it("stops the ordinary flow for high-risk language", () => {
    const initialStop = createLocalSession(
      "我今晚已经准备好吞药自杀，不想继续活下去了。",
      new Date("2026-07-11T10:00:00.000Z"),
    );
    expect(initialStop.stage).toBe("safety_stop");
    expect(initialStop.riskFlags).toContain("self_harm");
    expect(initialStop.riskFlags).toContain("immediate_danger");
    expect(initialStop.safetyMessage).toContain("120");
    expect(initialStop.suggestions).toEqual([]);

    const ordinary = createLocalSession(INTAKE);
    const laterStop = advanceLocalSession(ordinary, "我现在想拿刀伤害对方。");
    expect(laterStop.stage).toBe("safety_stop");
    expect(laterStop.riskFlags).toContain("harm_to_others");
    expect(laterStop.suggestions).toEqual([]);
  });
});
