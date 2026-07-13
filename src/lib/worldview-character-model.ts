export type CharacterAxisValue = 0 | 1 | 2 | 3;

export type CharacterValues = readonly [
  CharacterAxisValue,
  CharacterAxisValue,
  CharacterAxisValue,
  CharacterAxisValue,
];

export interface CharacterPalette {
  readonly accent: string;
  readonly soft: string;
  readonly coat: string;
  readonly lens: string;
  readonly name: string;
}

export interface CharacterStructureSpec {
  readonly scene: CharacterAxisValue;
  readonly faceShape: CharacterAxisValue;
  readonly body: CharacterAxisValue;
  readonly stance: CharacterAxisValue;
  readonly expression: {
    readonly brow: CharacterAxisValue;
    readonly eyes: CharacterAxisValue;
    readonly nose: CharacterAxisValue;
    readonly mouth: CharacterAxisValue;
    readonly cheek: CharacterAxisValue;
    readonly gaze: CharacterAxisValue;
  };
  readonly garment: {
    readonly collar: CharacterAxisValue;
    readonly seam: CharacterAxisValue;
    readonly markX: CharacterAxisValue;
    readonly markY: CharacterAxisValue;
    readonly markWidth: CharacterAxisValue;
    readonly markHeight: CharacterAxisValue;
  };
  readonly pose: {
    readonly key: `pose-${CharacterAxisValue}-${CharacterAxisValue}`;
    readonly field: CharacterAxisValue;
    readonly purpose: CharacterAxisValue;
    readonly bodyTransform: string;
    readonly headTransform: string;
  };
  readonly prop: CharacterAxisValue;
  readonly sigil: {
    readonly lobes: 3 | 4 | 5 | 6;
    readonly rotationStep: CharacterAxisValue;
    readonly outerRadiusStep: CharacterAxisValue;
    readonly innerRadiusStep: CharacterAxisValue;
    readonly satellites: 1 | 2 | 3 | 4;
  };
}

export interface CharacterRenderSpec {
  readonly values: CharacterValues;
  readonly structure: CharacterStructureSpec;
  readonly palette: CharacterPalette;
  readonly fingerprint: string;
}

interface CharacterProfileInput {
  readonly axes: readonly { readonly key: string; readonly value: number }[];
  readonly emblem: readonly number[];
}

const CHARACTER_PALETTES = [
  [
    { name: "砖红档案", accent: "#d76f61", soft: "#d76f6126", coat: "#2c2221", lens: "#322726" },
    { name: "赤陶锋面", accent: "#c95f70", soft: "#c95f7026", coat: "#2c2025", lens: "#34242a" },
    { name: "暖铜灯室", accent: "#d7864d", soft: "#d7864d26", coat: "#2d251e", lens: "#35291f" },
    { name: "珊瑚新页", accent: "#dc665c", soft: "#dc665c26", coat: "#2e211f", lens: "#362522" },
  ],
  [
    { name: "赭石警戒", accent: "#c99b4c", soft: "#c99b4c26", coat: "#2b271d", lens: "#332d20" },
    { name: "琥珀裂光", accent: "#d48a3f", soft: "#d48a3f26", coat: "#2e241b", lens: "#37291d" },
    { name: "苔金回路", accent: "#a9a855", soft: "#a9a85526", coat: "#28291f", lens: "#303124" },
    { name: "橙焰出口", accent: "#d97745", soft: "#d9774526", coat: "#30221b", lens: "#39271d" },
  ],
  [
    { name: "青瓷定标", accent: "#54a398", soft: "#54a39826", coat: "#1d2928", lens: "#213230" },
    { name: "潮蓝折面", accent: "#5496aa", soft: "#5496aa26", coat: "#1d282d", lens: "#223139" },
    { name: "群青内核", accent: "#6b83bf", soft: "#6b83bf26", coat: "#202532", lens: "#252c3c" },
    { name: "松绿生长", accent: "#499d7e", soft: "#499d7e26", coat: "#1c2924", lens: "#20332b" },
  ],
  [
    { name: "暮紫观测", accent: "#8c78bf", soft: "#8c78bf26", coat: "#272232", lens: "#2d273b" },
    { name: "梅色岔路", accent: "#a16d9b", soft: "#a16d9b26", coat: "#2c222d", lens: "#352738" },
    { name: "雾蓝远行", accent: "#778bc3", soft: "#778bc326", coat: "#222733", lens: "#282e3e" },
    { name: "莓红星图", accent: "#b36e7f", soft: "#b36e7f26", coat: "#302329", lens: "#392831" },
  ],
] as const satisfies readonly (readonly CharacterPalette[])[];

const FIELD_POSES = [
  { x: 0, y: 0, rotation: 0, headX: 0, headY: 0, headRotation: 0 },
  { x: -9, y: 4, rotation: -4.5, headX: -9, headY: 3, headRotation: -8 },
  { x: 0, y: -5, rotation: 0.5, headX: 0, headY: -7, headRotation: -1 },
  { x: 10, y: 2, rotation: 5, headX: 11, headY: 1, headRotation: 8 },
] as const;

const PURPOSE_POSES = [
  { x: 0, y: 0, rotation: 0, headX: 0, headY: 0, headRotation: 0 },
  { x: -3, y: -2, rotation: -1.5, headX: -2, headY: -2, headRotation: -2 },
  { x: 2, y: 1, rotation: 1, headX: 1, headY: 1, headRotation: 1.5 },
  { x: 4, y: -3, rotation: 2.5, headX: 3, headY: -2, headRotation: 3 },
] as const;

const EYE_HEAD_OFFSETS = [
  { x: 0, y: 0, rotation: 0 },
  { x: -3, y: 1, rotation: -2.5 },
  { x: 1, y: -2, rotation: 1 },
  { x: 4, y: 0, rotation: 3 },
] as const;

const ONTOLOGY_HEAD_SCALE = [1.04, 0.96, 1.08, 0.92] as const;
const PERCEPTION_HEAD_SCALE = [0.97, 1.04, 1.08, 0.93] as const;

export function normalizeCharacterAxisValue(value: number | undefined): CharacterAxisValue {
  if (value === undefined || !Number.isFinite(value)) return 0;
  return Math.min(3, Math.max(0, Math.round(value))) as CharacterAxisValue;
}

export function resolveCharacterValues(profile: CharacterProfileInput): CharacterValues {
  const keys = ["field", "ontology", "phenomenology", "teleology"] as const;
  return keys.map((key, index) => {
    const axis = profile.axes.find((candidate) => candidate.key === key) ?? profile.axes[index];
    return normalizeCharacterAxisValue(axis?.value ?? profile.emblem[index]);
  }) as unknown as CharacterValues;
}

export function characterStructureFingerprint(structure: CharacterStructureSpec): string {
  return [
    structure.scene,
    structure.faceShape,
    structure.body,
    structure.stance,
    structure.expression.brow,
    structure.expression.eyes,
    structure.expression.nose,
    structure.expression.mouth,
    structure.expression.cheek,
    structure.expression.gaze,
    structure.garment.collar,
    structure.garment.seam,
    structure.garment.markX,
    structure.garment.markY,
    structure.garment.markWidth,
    structure.garment.markHeight,
    structure.pose.key,
    structure.pose.bodyTransform,
    structure.pose.headTransform,
    structure.prop,
    structure.sigil.lobes,
    structure.sigil.rotationStep,
    structure.sigil.outerRadiusStep,
    structure.sigil.innerRadiusStep,
    structure.sigil.satellites,
  ].join("|");
}

export function characterSigilFingerprint(sigil: CharacterStructureSpec["sigil"]): string {
  return `${sigil.lobes}|${sigil.rotationStep}|${sigil.outerRadiusStep}|${sigil.innerRadiusStep}|${sigil.satellites}`;
}

export function characterFaceFingerprint(structure: CharacterStructureSpec): string {
  return [
    structure.faceShape,
    structure.expression.brow,
    structure.expression.eyes,
    structure.expression.nose,
    structure.expression.mouth,
    structure.expression.cheek,
    structure.expression.gaze,
  ].join("|");
}

export function characterPoseFingerprint(structure: CharacterStructureSpec): string {
  return `${structure.pose.key}|${structure.pose.bodyTransform}|${structure.pose.headTransform}`;
}

export function createCharacterRenderSpec(values: CharacterValues): CharacterRenderSpec {
  const [field, ontology, phenomenology, teleology] = values;
  const fieldPose = FIELD_POSES[field];
  const purposePose = PURPOSE_POSES[teleology];
  const eyeOffset = EYE_HEAD_OFFSETS[phenomenology];
  const bodyX = fieldPose.x + purposePose.x;
  const bodyY = fieldPose.y + purposePose.y;
  const bodyRotation = fieldPose.rotation + purposePose.rotation;
  const headX = fieldPose.headX + purposePose.headX + eyeOffset.x;
  const headY = fieldPose.headY + purposePose.headY + eyeOffset.y;
  const headRotation = fieldPose.headRotation + purposePose.headRotation + eyeOffset.rotation;
  const headScaleX = ONTOLOGY_HEAD_SCALE[ontology];
  const headScaleY = PERCEPTION_HEAD_SCALE[phenomenology];

  const structure: CharacterStructureSpec = {
    scene: field,
    faceShape: ontology,
    body: field,
    stance: field,
    expression: {
      brow: phenomenology,
      eyes: phenomenology,
      nose: ontology,
      mouth: teleology,
      cheek: field,
      gaze: field,
    },
    garment: {
      collar: ontology,
      seam: teleology,
      markX: ontology,
      markY: phenomenology,
      markWidth: field,
      markHeight: teleology,
    },
    pose: {
      key: `pose-${field}-${teleology}`,
      field,
      purpose: teleology,
      bodyTransform: `translate(${bodyX} ${bodyY}) rotate(${bodyRotation} 380 390)`,
      headTransform: `translate(${headX} ${headY}) rotate(${headRotation} 380 216) translate(380 216) scale(${headScaleX} ${headScaleY}) translate(-380 -216)`,
    },
    prop: teleology,
    sigil: {
      lobes: (3 + field) as 3 | 4 | 5 | 6,
      rotationStep: ontology,
      outerRadiusStep: phenomenology,
      innerRadiusStep: ontology,
      satellites: (teleology + 1) as 1 | 2 | 3 | 4,
    },
  };

  const palette = CHARACTER_PALETTES[field]?.[teleology] ?? CHARACTER_PALETTES[0][0];
  return {
    values,
    structure,
    palette,
    fingerprint: characterStructureFingerprint(structure),
  };
}
