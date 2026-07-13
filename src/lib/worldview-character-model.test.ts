import { describe, expect, it } from "vitest";

import {
  type CharacterAxisValue,
  type CharacterValues,
  characterFaceFingerprint,
  characterPoseFingerprint,
  characterSigilFingerprint,
  createCharacterRenderSpec,
  normalizeCharacterAxisValue,
  resolveCharacterValues,
} from "./worldview-character-model";

const VALUES = [0, 1, 2, 3] as const satisfies readonly CharacterAxisValue[];

function allValues(): CharacterValues[] {
  return VALUES.flatMap((field) =>
    VALUES.flatMap((ontology) =>
      VALUES.flatMap((phenomenology) =>
        VALUES.map((teleology) => [field, ontology, phenomenology, teleology] as const),
      ),
    ),
  );
}

describe("worldview character model", () => {
  it("produces 256 structurally unique characters without using palette as identity", () => {
    const specs = allValues().map(createCharacterRenderSpec);

    expect(specs).toHaveLength(256);
    expect(new Set(specs.map((spec) => spec.fingerprint))).toHaveLength(256);
    expect(new Set(specs.map((spec) => characterFaceFingerprint(spec.structure)))).toHaveLength(
      256,
    );
    expect(new Set(specs.map((spec) => characterPoseFingerprint(spec.structure)))).toHaveLength(
      256,
    );
    expect(
      new Set(specs.map((spec) => characterSigilFingerprint(spec.structure.sigil))),
    ).toHaveLength(256);
  });

  it("keeps all 16 ontology and perception combinations distinct inside one color and pose family", () => {
    for (const field of VALUES) {
      for (const teleology of VALUES) {
        const group = VALUES.flatMap((ontology) =>
          VALUES.map((phenomenology) =>
            createCharacterRenderSpec([field, ontology, phenomenology, teleology]),
          ),
        );
        expect(new Set(group.map((spec) => spec.palette.name))).toHaveLength(1);
        expect(new Set(group.map((spec) => spec.fingerprint))).toHaveLength(16);
        expect(new Set(group.map((spec) => spec.structure.pose.key))).toHaveLength(1);
      }
    }
  });

  it("changes a prominent visual channel whenever one axis changes", () => {
    for (const values of allValues()) {
      const current = createCharacterRenderSpec(values).structure;
      for (const axisIndex of [0, 1, 2, 3] as const) {
        const changedValue = ((values[axisIndex] + 1) % 4) as CharacterAxisValue;
        const nextValues = [...values] as [
          CharacterAxisValue,
          CharacterAxisValue,
          CharacterAxisValue,
          CharacterAxisValue,
        ];
        nextValues[axisIndex] = changedValue;
        const next = createCharacterRenderSpec(nextValues).structure;

        if (axisIndex === 0) {
          expect([next.scene, next.body, next.stance, next.pose.field]).not.toEqual([
            current.scene,
            current.body,
            current.stance,
            current.pose.field,
          ]);
        } else if (axisIndex === 1) {
          expect([next.faceShape, next.expression.nose, next.garment.collar]).not.toEqual([
            current.faceShape,
            current.expression.nose,
            current.garment.collar,
          ]);
        } else if (axisIndex === 2) {
          expect([next.expression.eyes, next.expression.brow, next.pose.headTransform]).not.toEqual(
            [current.expression.eyes, current.expression.brow, current.pose.headTransform],
          );
        } else {
          expect([next.expression.mouth, next.pose.key, next.prop, next.garment.seam]).not.toEqual([
            current.expression.mouth,
            current.pose.key,
            current.prop,
            current.garment.seam,
          ]);
        }
      }
    }
  });

  it("normalizes invalid values and resolves shuffled axes deterministically", () => {
    expect(normalizeCharacterAxisValue(Number.NaN)).toBe(0);
    expect(normalizeCharacterAxisValue(-7)).toBe(0);
    expect(normalizeCharacterAxisValue(9)).toBe(3);
    expect(normalizeCharacterAxisValue(1.6)).toBe(2);

    const profile = {
      axes: [
        { key: "teleology", value: 3 },
        { key: "field", value: 1 },
        { key: "phenomenology", value: 2 },
        { key: "ontology", value: 0 },
      ],
      emblem: [3, 3, 3, 3],
    };
    expect(resolveCharacterValues(profile)).toEqual([1, 0, 2, 3]);
  });
});
