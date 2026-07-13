import { describe, expect, it } from "vitest";

import { suggestionAnswerText, unwrapAnswerSuggestions } from "./types";

describe("session answer suggestions", () => {
  it("keeps the philosophical answer and concrete example separately", () => {
    const payload = unwrapAnswerSuggestions({
      source: "deepseek",
      suggestions: [
        {
          id: "ai-conditions",
          lens: "conditions",
          content: "我会先看已经存在的资源与规则。",
          example: "比如：比较两名求职者时，我会先看培训预算和试错时间。",
        },
      ],
    });

    const suggestion = payload.suggestions[0];
    expect(suggestion).toMatchObject({
      lens: "conditions",
      example: "比如：比较两名求职者时，我会先看培训预算和试错时间。",
    });
    if (suggestion === undefined) return;
    expect(suggestionAnswerText(suggestion)).toBe(
      "我会先看已经存在的资源与规则。\n比如：比较两名求职者时，我会先看培训预算和试错时间。",
    );
  });

  it("keeps old suggestions without examples editable", () => {
    expect(suggestionAnswerText({ id: "legacy", content: "我还需要更多证据。" })).toBe(
      "我还需要更多证据。",
    );
  });
});
