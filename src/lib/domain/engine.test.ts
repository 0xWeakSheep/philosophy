import { describe, expect, it } from "vitest";

import {
  advanceLocalSession,
  createCounterfactualExperiment,
  createLocalSession,
  updateHypothesisStance,
} from "./engine";

const INTAKE =
  "对方临时取消了约会，我很生气，却告诉自己成熟的人不应该计较。我最后说没关系，之后又会冷淡好几天。";

function completeSession() {
  let session = createLocalSession(INTAKE, new Date("2026-07-11T10:00:00.000Z"));
  const answers = [
    "我担心如果连约定都不重要，这段关系就没有可以信任的规则。",
    "最不能失去的是被认真对待，我不想自己的时间总是可以被牺牲。",
    "我最先觉得胸口发紧，然后马上告诉自己别显得太计较。",
    "我说没关系是在避免争吵，但冷淡其实是在等对方看见我的失望。",
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
    expect(session.totalQuestions).toBe(4);
    expect(session.messages).toHaveLength(2);
    expect(session.messages[1]?.role).toBe("mirror");
    expect(session.messages[1]?.dimension).toBe("field");
    expect(session.marker).toContain("不应该");
  });

  it("finishes after four answers and binds evidence to user messages", () => {
    const session = completeSession();

    expect(session.stage).toBe("result");
    expect(session.questionIndex).toBe(4);
    expect(session.result?.hypotheses).toHaveLength(3);
    expect(session.result?.dimensions).toHaveLength(4);
    expect(session.result?.uncertainties.length).toBeGreaterThanOrEqual(1);

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
    session = advanceLocalSession(session, "我怕约定会变得不再算数。");
    session = advanceLocalSession(session, "最不能失去的是被认真对待。");
    session = advanceLocalSession(session, "最先是胸口发紧，然后想让自己冷静。");

    const question = session.messages.findLast((message) => message.role === "mirror")?.content;
    expect(question).toContain("你刚才写到");
    expect(question).not.toContain("。”。");
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
      "在工作关系里我会直接说清边界。",
      new Date("2026-07-11T10:06:00.000Z"),
    );
    expect(revised.result?.hypotheses[0]?.stance).toBe("counterexample");
    expect(revised.result?.hypotheses[0]?.stanceNote).toContain("工作关系");

    const created = createCounterfactualExperiment(
      revised,
      "phenomenology",
      new Date("2026-07-11T10:07:00.000Z"),
    );
    expect(created.experiment.changedDimension).toBe("phenomenology");
    expect(created.experiment.before).toContain("经验如何出现");
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

    const ordinary = createLocalSession(INTAKE);
    const laterStop = advanceLocalSession(ordinary, "我现在想拿刀伤害对方。");
    expect(laterStop.stage).toBe("safety_stop");
    expect(laterStop.riskFlags).toContain("harm_to_others");
  });
});
