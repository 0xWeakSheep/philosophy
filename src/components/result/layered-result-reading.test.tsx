import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LayeredResultReading } from "./layered-result-reading";

const reading = {
  surfacePhenomenon: {
    title: "先把争论变成一个能决定的问题",
    summary: "你会先寻找谁能拍板、哪条原则可以让讨论停下来。",
  },
  deepStructure: {
    title: "你真正保护的是可持续的秩序",
    summary: "你担心的不是意见不同，而是分歧最终无人承担、无法执行。",
  },
  realityGround: {
    title: "它依赖明确的权责与纠错入口",
    summary: "没有责任归属、边界和复盘机制，所谓秩序只会变成一句口号。",
  },
  observableExpression: {
    title: "别人会觉得你擅长收束，也可能太快定调",
    summary: "团队通常能从你这里得到行动标准，但边缘意见也可能因此更难被听见。",
  },
} as const;

describe("LayeredResultReading", () => {
  it("renders the four meanings in their intended depth order", () => {
    const markup = renderToStaticMarkup(<LayeredResultReading {...reading} />);

    expect(markup).toContain("把这个结果向下剖开");
    expect(markup).toContain('aria-label="结果的四层透视"');
    expect(markup.match(/data-reading-layer=/gu)).toHaveLength(4);

    const visibleLabels = [
      "表层｜你如何定义问题",
      "深层｜可能在保护什么",
      "现实｜需要核对的支点",
      "外显｜别人会看到什么",
    ];
    for (const label of visibleLabels) expect(markup).toContain(label);

    const positions = [
      reading.surfacePhenomenon.title,
      reading.deepStructure.title,
      reading.realityGround.title,
      reading.observableExpression.title,
    ].map((title) => markup.indexOf(title));
    expect(positions).toEqual([...positions].sort((left, right) => left - right));
  });

  it("keeps every generated title and summary visible", () => {
    const markup = renderToStaticMarkup(<LayeredResultReading {...reading} />);

    for (const layer of Object.values(reading)) {
      expect(markup).toContain(layer.title);
      expect(markup).toContain(layer.summary);
    }
  });
});
