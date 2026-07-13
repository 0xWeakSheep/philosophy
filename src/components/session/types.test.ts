import { describe, expect, it } from "vitest";

import { suggestionAnswerText, unwrapAnswerSuggestions, unwrapSession } from "./types";

describe("session answer suggestions", () => {
  it("keeps the philosophical answer and concrete example separately", () => {
    const payload = unwrapAnswerSuggestions({
      source: "deepseek",
      suggestions: [
        {
          id: "ai-conditions",
          lens: "conditions",
          title: "先看现实条件",
          content: "我会先看已经存在的资源与规则。",
          example: "比如：比较两名求职者时，我会先看培训预算和试错时间。",
        },
      ],
    });

    const suggestion = payload.suggestions[0];
    expect(suggestion).toMatchObject({
      lens: "conditions",
      title: "先看现实条件",
      example: "比如：比较两名求职者时，我会先看培训预算和试错时间。",
    });
    if (suggestion === undefined) return;
    expect(suggestionAnswerText(suggestion)).toBe("我会先看已经存在的资源与规则。");
  });

  it("keeps old suggestions without examples editable", () => {
    expect(suggestionAnswerText({ id: "legacy", content: "我还需要更多证据。" })).toBe(
      "我还需要更多证据。",
    );
  });

  it("keeps a plain-language question alongside its philosophical wording", () => {
    const session = unwrapSession({
      id: "session-1",
      messages: [
        {
          id: "question-1",
          role: "mirror",
          content: "在任何选择之前，哪些前置条件已经存在？",
          plainLanguage: "说具体一点，这件事主要是个人选择，还是现实条件造成的？",
        },
      ],
    });

    expect(session.messages[0]?.plainLanguage).toBe(
      "说具体一点，这件事主要是个人选择，还是现实条件造成的？",
    );
    expect(session.messages[0]?.content).toBe("在任何选择之前，哪些前置条件已经存在？");
  });
});
