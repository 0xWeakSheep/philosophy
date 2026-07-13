import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AnswerSuggestions } from "./answer-suggestions";

describe("AnswerSuggestions", () => {
  it("makes the plain title and concrete example visible without merging their meanings", () => {
    const markup = renderToStaticMarkup(
      <AnswerSuggestions
        suggestions={[
          {
            id: "conditions",
            lens: "conditions",
            title: "先看公司给了什么条件",
            content: "如果没有培训和试错时间，把后果都算给个人并不公平。",
            example: "比如：两名开发者都要使用 AI，但只有一人获得了培训和工具权限。",
          },
        ]}
        selectedId="conditions"
        refreshing={false}
        source="deepseek"
        onSelect={() => undefined}
        onRefresh={() => undefined}
      />,
    );

    expect(markup).toContain("先看公司给了什么条件");
    expect(markup).toContain("如果没有培训和试错时间，把后果都算给个人并不公平。");
    expect(markup).toContain("比如：两名开发者都要使用 AI，但只有一人获得了培训和工具权限。");
    expect(markup).toContain("例子只帮助理解，不会写进你的回答。");
    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain("snap-x");
    expect(markup).toContain("w-[82vw]");
    expect(markup).toContain("sm:grid-cols-2");
  });

  it("uses the lens label as a title for legacy suggestions", () => {
    const markup = renderToStaticMarkup(
      <AnswerSuggestions
        suggestions={[
          {
            id: "legacy",
            lens: "conditions",
            content: "我会先看资源、规则和行动成本。",
          },
        ]}
        selectedId={null}
        refreshing={false}
        source="local"
        onSelect={() => undefined}
        onRefresh={() => undefined}
      />,
    );

    expect(markup).toContain("先看条件");
    expect(markup).toContain("我会先看资源、规则和行动成本。");
  });
});
