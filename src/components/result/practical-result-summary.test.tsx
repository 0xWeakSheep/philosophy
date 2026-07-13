import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PracticalResultSummary } from "./practical-result-summary";

const baseProps = {
  canonicalName: "安防了的实存主义",
  code: "3-3-2-1",
  plainSummary: "你会先看见冲突，再寻找能够承担决定的位置。",
  strengths: ["能识别矛盾"],
  blindSpots: ["可能压低边缘声音"],
  nameExplanation: "这是本次议题中的坐标简称，不是固定人格。",
  verificationQuestion: "如果边缘成员能修改规则，决定会怎样变化？",
  scopeNote: "这份结果只绑定本次议题。",
} as const;

describe("PracticalResultSummary", () => {
  it("keeps the legacy team scenario when no layered reading follows", () => {
    const markup = renderToStaticMarkup(
      <PracticalResultSummary {...baseProps} teamScenario="你会先明确谁负责，再收束分歧。" />,
    );

    expect(markup).toContain("放进团队里，会这样表现");
    expect(markup).toContain("你会先明确谁负责，再收束分歧。");
  });

  it("can omit the duplicate team block when the four-layer reading owns behavior", () => {
    const markup = renderToStaticMarkup(<PracticalResultSummary {...baseProps} />);

    expect(markup).not.toContain("放进团队里，会这样表现");
    expect(markup).toContain("这个名字是什么意思");
    expect(markup).toContain("你可能带来的价值");
  });

  it("can defer strengths and trouble costs to the structured growth section", () => {
    const markup = renderToStaticMarkup(
      <PracticalResultSummary
        {...baseProps}
        showCapabilityLists={false}
        showVerification={false}
      />,
    );

    expect(markup).not.toContain("你可能带来的价值");
    expect(markup).not.toContain("你需要警惕的代价");
    expect(markup).not.toContain("拿一个真实场景验证它");
    expect(markup).toContain("这个名字是什么意思");
  });
});
