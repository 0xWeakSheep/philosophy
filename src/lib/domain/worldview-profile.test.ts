import { describe, expect, it } from "vitest";

import {
  createWorldviewProfile,
  type WorldviewDimensionInput,
  type WorldviewSignal,
} from "./worldview-profile";

const SIGNALS = [
  "order",
  "conflict",
  "center",
  "open",
] as const satisfies readonly WorldviewSignal[];

function dimensionsFor(
  field: WorldviewSignal,
  ontology: WorldviewSignal,
  phenomenology: WorldviewSignal,
  teleology: WorldviewSignal,
): WorldviewDimensionInput[] {
  return [
    { dimension: "field", signal: field },
    { dimension: "ontology", signal: ontology },
    { dimension: "phenomenology", signal: phenomenology },
    { dimension: "teleology", signal: teleology },
  ];
}

function allProfiles() {
  return SIGNALS.flatMap((field) =>
    SIGNALS.flatMap((ontology) =>
      SIGNALS.flatMap((phenomenology) =>
        SIGNALS.map((teleology) =>
          createWorldviewProfile(
            dimensionsFor(field, ontology, phenomenology, teleology),
            "公平与选择",
          ),
        ),
      ),
    ),
  );
}

describe("createWorldviewProfile", () => {
  it("enumerates all 256 combinations with unique codes, names, and emblems", () => {
    const profiles = allProfiles();

    expect(profiles).toHaveLength(256);
    expect(new Set(profiles.map((profile) => profile.code))).toHaveLength(256);
    expect(new Set(profiles.map((profile) => profile.name))).toHaveLength(256);
    expect(new Set(profiles.map((profile) => profile.emblem.join("-")))).toHaveLength(256);
    expect(profiles.every((profile) => /^[1-4](?:–[1-4]){3}$/u.test(profile.code))).toBe(true);
  });

  it("groups the 256 profiles into four field families and sixteen core archetypes", () => {
    const profiles = allProfiles();
    const familyCounts = Map.groupBy(profiles, (profile) => profile.archetypeFamily);
    const archetypeCounts = Map.groupBy(profiles, (profile) => profile.archetypeTitle);

    expect([...familyCounts.keys()].sort()).toEqual(
      ["织序家族", "裂隙家族", "星核家族", "旷野家族"].sort(),
    );
    expect([...familyCounts.values()].map((family) => family.length)).toEqual([64, 64, 64, 64]);
    expect(archetypeCounts.size).toBe(16);
    expect([...archetypeCounts.values()].every((archetype) => archetype.length === 16)).toBe(true);
    expect(
      [...archetypeCounts.values()].every(
        (archetype) => new Set(archetype.map((profile) => profile.name)).size === 16,
      ),
    ).toBe(true);
  });

  it("derives a stable family from field and a stable title from field plus teleology", () => {
    const first = createWorldviewProfile(dimensionsFor("conflict", "order", "order", "conflict"));
    const middleAxesChanged = createWorldviewProfile(
      dimensionsFor("conflict", "open", "center", "conflict"),
    );
    const purposeChanged = createWorldviewProfile(
      dimensionsFor("conflict", "open", "center", "open"),
    );

    expect(first.archetypeFamily).toBe("裂隙家族");
    expect(first.archetypeTitle).toBe("裂隙破题人");
    expect(first.archetypeLine).toContain("矛盾");
    expect(middleAxesChanged.archetypeFamily).toBe(first.archetypeFamily);
    expect(middleAxesChanged.archetypeTitle).toBe(first.archetypeTitle);
    expect(middleAxesChanged.name).not.toBe(first.name);
    expect(purposeChanged.archetypeFamily).toBe(first.archetypeFamily);
    expect(purposeChanged.archetypeTitle).not.toBe(first.archetypeTitle);
  });

  it("maps signals to stable digits, axes, and 0-3 emblem values", () => {
    const profile = createWorldviewProfile(
      dimensionsFor("center", "conflict", "open", "order"),
      "亲密关系中的责任",
    );

    expect(profile.code).toBe("3–2–4–1");
    expect(profile.axes.map((axis) => axis.key)).toEqual([
      "field",
      "ontology",
      "phenomenology",
      "teleology",
    ]);
    expect(profile.axes.map((axis) => axis.digit)).toEqual([3, 2, 4, 1]);
    expect(profile.axes.map((axis) => axis.value)).toEqual([2, 1, 3, 0]);
    expect(profile.axes.every((axis) => axis.stateName.length > 0)).toBe(true);
    expect(profile.axes.every((axis) => axis.description.length > 0)).toBe(true);
    expect(profile.emblem).toEqual([2, 1, 3, 0]);
    expect(profile.emblem.every((value) => value >= 0 && value <= 3)).toBe(true);
    expect(profile.traits).toHaveLength(4);
    expect(profile.blindSpot).toContain("提醒");
  });

  it("is deterministic and independent of dimension input order", () => {
    const canonical = dimensionsFor("open", "order", "center", "conflict");
    const shuffled = [canonical[2], canonical[0], canonical[3], canonical[1]].filter(
      (entry): entry is WorldviewDimensionInput => entry !== undefined,
    );

    const first = createWorldviewProfile(canonical, "职业选择");
    const second = createWorldviewProfile(shuffled, "职业选择");
    const third = createWorldviewProfile(canonical, "职业选择");

    expect(second).toEqual(first);
    expect(third).toEqual(first);
  });

  it("keeps the identity scoped to the current topic and rejects diagnostic framing", () => {
    const profile = createWorldviewProfile(
      dimensionsFor("order", "order", "order", "order"),
      "  家庭   期待  ",
    );

    expect(profile.topic).toBe("家庭 期待");
    expect(profile.scopeNote).toContain("只绑定本次议题");
    expect(profile.scopeNote).toContain("不是固定人格");
    expect(profile.scopeNote).toContain("不是临床诊断");
    expect(profile.shareText).toContain(profile.name);
    expect(profile.shareText).toContain(profile.code);
    expect(profile.shareText).toContain(
      `我是【${profile.archetypeTitle}】· ${profile.name}（${profile.code}）`,
    );
    expect(profile.shareText).toContain(profile.archetypeLine);
    expect(profile.shareText).toContain("只描述这次议题，不是固定人格");
  });

  it("requires exactly one valid signal for every dimension", () => {
    expect(() =>
      createWorldviewProfile(dimensionsFor("order", "conflict", "center", "open").slice(0, 3)),
    ).toThrow("四个维度");

    expect(() =>
      createWorldviewProfile([
        { dimension: "field", signal: "order" },
        { dimension: "field", signal: "conflict" },
        { dimension: "phenomenology", signal: "center" },
        { dimension: "teleology", signal: "open" },
      ]),
    ).toThrow("不能重复");
  });
});
