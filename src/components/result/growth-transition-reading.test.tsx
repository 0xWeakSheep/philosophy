import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { GrowthTransitionReadingPanel } from "./growth-transition-reading";

const reading = {
  frictionPoints: [
    {
      title: "冲突迟迟没有结论时，会越来越着急",
      trigger: "会议已经讨论很久，却没有人愿意作出决定。",
      feltExperience: "再不定下来，事情就会失控",
      concreteExample: "例如团队对发布时间争执不下时，你会立刻追问谁有最终决定权。",
      hiddenCost: "为了尽快收束，你可能还没听清边缘意见就把问题变成二选一。",
    },
    {
      title: "规则被临时打破时，会感到不公平",
      trigger: "别人用例外绕过一套原本共同接受的流程。",
      feltExperience: "如果这次可以例外，以后规则就没有意义",
      concreteExample: "例如同事跳过评审直接上线时，你更先关注程序被破坏，而不是这次上线的效果。",
      hiddenCost: "你可能把修正规则的机会误判成对秩序的威胁。",
    },
  ],
  strengths: [
    {
      title: "把分歧变成可执行边界",
      bestUse: "责任模糊、团队需要快速止损的时刻。",
      concreteExample: "例如事故发生后，先明确负责人、截止时间和复盘入口。",
    },
    {
      title: "看见长期运行的代价",
      bestUse: "一项临时决定可能重复发生时。",
      concreteExample: "例如不只解决这次争执，还把例外条件写进下一版规则。",
    },
  ],
  transition: {
    focusDimension: "phenomenology",
    focusLabel: "从先收束冲突，转向先容纳尚未解释的差异",
    from: "冲突",
    to: "开放",
    targetCode: "3-3-4-1",
    targetName: "多声部秩序主义",
    moveName: "打开冲突",
    roleShift: "从“负责尽快定调的人”暂时切换为“先让关键分歧被准确说出的人”。",
    rationale: "你不需要放弃边界感，只需要让规则形成之前，多经过一次反例和少数意见的压力测试。",
    tradeoff: "多听一轮会增加沟通成本，所以仍要保留截止时间和最终负责人。",
    steps: [
      {
        instruction: "在提出结论前，先复述一个与你不同的判断。",
        concreteExample: "例如先说“你的担心不是延期，而是上线后无人兜底，对吗？”",
        completionSignal: "完成信号：对方确认你准确说出了他的核心顾虑。",
      },
      {
        instruction: "主动找一个现有规则会伤害重要目标的真实场景。",
        concreteExample: "例如追问“如果必须按流程等待两天，线上故障会不会扩大？”",
        completionSignal: "你能说出一条例外成立的具体条件。",
      },
      {
        instruction: "作出决定时，同时约定复盘时间和修改规则的门槛。",
        concreteExample: "例如先试行一周；若返工率超过 10%，就重新评审。",
        completionSignal: "完成信号：决定里同时出现负责人、期限和可触发的复盘条件。",
      },
    ],
  },
  scopeNote: "这是一条针对本次议题的练习路径，不代表固定人格，也不替代专业的心理或医疗支持。",
} as const;

describe("GrowthTransitionReadingPanel", () => {
  it("keeps friction, strengths and transition in one scannable narrative", () => {
    const markup = renderToStaticMarkup(<GrowthTransitionReadingPanel {...reading} />);

    expect(markup).toContain("哪里容易卡住，怎样换挡");
    expect(markup).toContain('aria-label="容易遇到的纠结、焦虑与麻烦"');
    expect(markup).toContain('aria-label="当前思维方式的优势"');
    expect(markup).toContain('aria-label="思维转轨练习步骤"');
    expect(markup).toContain(reading.transition.from);
    expect(markup).toContain(reading.transition.to);
    expect(markup).toContain(reading.transition.focusLabel);
    expect(markup).toContain(reading.transition.roleShift);
    expect(markup).toContain(reading.transition.rationale);
    expect(markup).not.toContain("例如例如");

    const sectionPositions = ["最容易出现的摩擦", "你已经有的支点", "下一步，不是换人格"].map(
      (label) => markup.indexOf(label),
    );
    expect(sectionPositions).toEqual([...sectionPositions].sort((left, right) => left - right));
  });

  it("renders every concrete example and completion signal", () => {
    const markup = renderToStaticMarkup(<GrowthTransitionReadingPanel {...reading} />);

    for (const point of reading.frictionPoints) {
      expect(markup).toContain(point.trigger);
      expect(markup).toContain(point.feltExperience);
      expect(markup).toContain(point.concreteExample.replace(/^例如/u, ""));
      expect(markup).toContain(point.hiddenCost);
    }
    for (const strength of reading.strengths) {
      expect(markup).toContain(strength.bestUse);
      expect(markup).toContain(strength.concreteExample.replace(/^例如/u, ""));
    }
    for (const step of reading.transition.steps) {
      expect(markup).toContain(step.concreteExample.replace(/^例如/u, ""));
      expect(markup).toContain(step.completionSignal.replace(/^完成信号[：:]\s*/u, ""));
    }
  });

  it("shows the target coordinate, route cost and scope boundary", () => {
    const markup = renderToStaticMarkup(<GrowthTransitionReadingPanel {...reading} />);

    expect(markup).toContain(reading.transition.targetCode);
    expect(markup).toContain(reading.transition.moveName);
    expect(markup).toContain(reading.transition.tradeoff);
    expect(markup).toContain(reading.transition.targetName);
    expect(markup).toContain(reading.scopeNote);
  });
});
