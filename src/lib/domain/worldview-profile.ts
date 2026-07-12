import type { Dimension } from "./schemas";

export type WorldviewSignal = "order" | "conflict" | "center" | "open";
export type WorldviewDigit = 1 | 2 | 3 | 4;
export type EmblemValue = 0 | 1 | 2 | 3;
export type WorldviewArchetypeFamily = "织序家族" | "裂隙家族" | "星核家族" | "旷野家族";
export type WorldviewCode =
  `${WorldviewDigit}–${WorldviewDigit}–${WorldviewDigit}–${WorldviewDigit}`;

export interface WorldviewDimensionInput {
  readonly dimension: Dimension;
  readonly signal: WorldviewSignal;
}

export interface WorldviewAxis {
  readonly key: Dimension;
  readonly label: string;
  readonly value: EmblemValue;
  readonly digit: WorldviewDigit;
  readonly stateName: string;
  readonly description: string;
}

export interface WorldviewProfile {
  readonly code: WorldviewCode;
  readonly name: string;
  readonly archetypeTitle: string;
  readonly archetypeFamily: WorldviewArchetypeFamily;
  readonly archetypeLine: string;
  readonly tagline: string;
  readonly topic: string;
  readonly axes: WorldviewAxis[];
  readonly emblem: readonly [EmblemValue, EmblemValue, EmblemValue, EmblemValue];
  readonly traits: readonly [string, string, string, string];
  readonly blindSpot: string;
  readonly scopeNote: string;
  readonly shareText: string;
}

interface AxisDefinition {
  readonly nameToken: string;
  readonly stateName: string;
  readonly description: string;
  readonly trait: string;
  readonly blindSpot: string;
  readonly taglinePart: string;
}

interface ArchetypeDefinition {
  readonly title: string;
  readonly line: string;
}

const DIMENSION_ORDER = [
  "field",
  "ontology",
  "phenomenology",
  "teleology",
] as const satisfies readonly Dimension[];

const DIMENSION_LABELS = {
  field: "场域",
  ontology: "本体",
  phenomenology: "现象",
  teleology: "目的",
} as const satisfies Record<Dimension, string>;

const SIGNAL_VALUES = {
  order: { digit: 1, emblem: 0 },
  conflict: { digit: 2, emblem: 1 },
  center: { digit: 3, emblem: 2 },
  open: { digit: 4, emblem: 3 },
} as const satisfies Record<
  WorldviewSignal,
  { readonly digit: WorldviewDigit; readonly emblem: EmblemValue }
>;

const ARCHETYPE_FAMILIES = {
  order: "织序家族",
  conflict: "裂隙家族",
  center: "星核家族",
  open: "旷野家族",
} as const satisfies Record<WorldviewSignal, WorldviewArchetypeFamily>;

/**
 * The field signal establishes one of four visual families, while teleology
 * determines how that family moves through the world. Together they form the
 * 16 memorable roles that sit above the more specific 256 worldview names.
 */
const ARCHETYPE_DEFINITIONS = {
  order: {
    order: {
      title: "秩序编织者",
      line: "我把散落的规则，织成可以共同生活的秩序。",
    },
    conflict: {
      title: "规约破壁者",
      line: "我从规则内部找到裂口，让僵住的秩序重新流动。",
    },
    center: {
      title: "航向定锚者",
      line: "我为复杂局面定下锚点，让选择拥有共同航向。",
    },
    open: {
      title: "新局育种者",
      line: "我在秩序里留下试验田，让新规则有机会长出来。",
    },
  },
  conflict: {
    order: {
      title: "张力调律师",
      line: "我不抹平分歧，而是让彼此牵制得更有分寸。",
    },
    conflict: {
      title: "裂隙破题人",
      line: "我让被遮住的矛盾现身，从最难回避处打开问题。",
    },
    center: {
      title: "矛盾聚光者",
      line: "我把冲突聚向真正的焦点，让代价与选择都被看见。",
    },
    open: {
      title: "分歧开路人",
      line: "我把不同声音变成岔路，为局面打开新的出口。",
    },
  },
  center: {
    order: {
      title: "意义守灯人",
      line: "我守住不可轻易让渡的意义，让行动不至于失去方向。",
    },
    conflict: {
      title: "核心重铸者",
      line: "我愿意击碎失效的中心，只为重铸真正值得相信的核心。",
    },
    center: {
      title: "星核领航者",
      line: "我围绕最重要的那颗星，组织注意、资源与选择。",
    },
    open: {
      title: "意义造境者",
      line: "我让核心意义长出新场景，使理想获得更多实现方式。",
    },
  },
  open: {
    order: {
      title: "可能收束者",
      line: "我从许多可能中找到可持续的一条，让探索能够落地。",
    },
    conflict: {
      title: "旷野越界者",
      line: "我越过默认边界，把不被允许的可能带回视野。",
    },
    center: {
      title: "未知寻星者",
      line: "我在尚未命名的地方寻找星光，再为探索暂定方向。",
    },
    open: {
      title: "新境孵化者",
      line: "我为偶然与试错保留空间，让不存在的道路慢慢成形。",
    },
  },
} as const satisfies Record<WorldviewSignal, Record<WorldviewSignal, ArchetypeDefinition>>;

const AXIS_DEFINITIONS = {
  field: {
    order: {
      nameToken: "整域",
      stateName: "有界秩序",
      description: "世界先呈现为有规则、可重复的整体。",
      trait: "先确认规则、边界与可重复的关系。",
      blindSpot: "既有规则可能遮住规则外的经验",
      taglinePart: "从既有秩序出发",
    },
    conflict: {
      nameToken: "裂域",
      stateName: "张力场域",
      description: "世界由差异力量及其冲突共同塑形。",
      trait: "先看见力量分布与相互牵制。",
      blindSpot: "持续寻找对立可能低估合作空间",
      taglinePart: "从场域张力出发",
    },
    center: {
      nameToken: "枢域",
      stateName: "中心场域",
      description: "世界围绕一个能组织全局的枢纽展开。",
      trait: "先寻找能够组织全局的关键枢纽。",
      blindSpot: "过度聚焦枢纽可能让边缘失声",
      taglinePart: "从意义枢纽出发",
    },
    open: {
      nameToken: "旷域",
      stateName: "开放场域",
      description: "世界保留例外、失败与重新开局的入口。",
      trait: "先为例外、失败与未知留出位置。",
      blindSpot: "长期保持开放可能推迟必要取舍",
      taglinePart: "从开放情境出发",
    },
  },
  ontology: {
    order: {
      nameToken: "实核",
      stateName: "稳定实在",
      description: "真实被理解为不随解释轻易改变的事实。",
      trait: "相信稳定事实能为判断提供底座。",
      blindSpot: "稳定事实也可能依赖特定语境",
      taglinePart: "辨认稳定事实",
    },
    conflict: {
      nameToken: "双实",
      stateName: "分裂实在",
      description: "真实包含无法被单一解释消除的对立面。",
      trait: "承认相互冲突的现实可以同时有效。",
      blindSpot: "分裂并不总是唯一的真实结构",
      taglinePart: "辨认相互牵制的现实",
    },
    center: {
      nameToken: "本心",
      stateName: "意义核心",
      description: "真实围绕不可轻易让渡的核心意义聚拢。",
      trait: "寻找不可让渡的核心意义。",
      blindSpot: "所谓核心可能是后来被组织出来的",
      taglinePart: "辨认不可让渡的核心",
    },
    open: {
      nameToken: "未定",
      stateName: "未定实在",
      description: "真实被看作关系中持续生成的未完成过程。",
      trait: "允许真实在关系与变化中继续成形。",
      blindSpot: "未定性不等于所有解释同样有效",
      taglinePart: "辨认尚未定形的可能",
    },
  },
  phenomenology: {
    order: {
      nameToken: "澄镜",
      stateName: "澄明表象",
      description: "经验通过清晰分类与连贯证据进入判断。",
      trait: "用清晰分类整理经验与证据。",
      blindSpot: "清晰叙述可能抹平暧昧经验",
      taglinePart: "用清晰表象",
    },
    conflict: {
      nameToken: "复镜",
      stateName: "复调经验",
      description: "经验在多种视角的差异与争执中显现。",
      trait: "让不同视角相互校正而不急于合并。",
      blindSpot: "多重视角可能让判断失去落点",
      taglinePart: "用复调经验",
    },
    center: {
      nameToken: "凝视",
      stateName: "聚焦经验",
      description: "经验由主体最在意的焦点赋予轻重。",
      trait: "追踪最有分量的感受与注意焦点。",
      blindSpot: "强烈感受可能挤压反例",
      taglinePart: "用主体焦点",
    },
    open: {
      nameToken: "游观",
      stateName: "流动经验",
      description: "经验允许含混、游移与尚未命名的感受停留。",
      trait: "让含混经验停留片刻再命名。",
      blindSpot: "持续流动可能难以积累证据",
      taglinePart: "用流动感受",
    },
  },
  teleology: {
    order: {
      nameToken: "守衡",
      stateName: "维持秩序",
      description: "行动倾向保存可持续、可预期的安排。",
      trait: "优先维护可持续且可预期的安排。",
      blindSpot: "维护可能悄悄滑向惯性",
      taglinePart: "守住可持续的安排",
    },
    conflict: {
      nameToken: "破界",
      stateName: "冲突破局",
      description: "行动倾向让矛盾显形并推动结构改变。",
      trait: "通过矛盾显形推动结构改变。",
      blindSpot: "破局可能把代价推给他人",
      taglinePart: "推动矛盾显形与破局",
    },
    center: {
      nameToken: "归心",
      stateName: "目标汇聚",
      description: "行动围绕一个关键目标组织资源与选择。",
      trait: "围绕关键目标组织资源与选择。",
      blindSpot: "目标聚焦可能把手段工具化",
      taglinePart: "汇向关键目标",
    },
    open: {
      nameToken: "创生",
      stateName: "开放生成",
      description: "行动保留试验、转向与创造新路径的余地。",
      trait: "以小步试验创造尚不存在的路径。",
      blindSpot: "生成冲动可能忽略承诺和收尾",
      taglinePart: "为新的生成留出余地",
    },
  },
} as const satisfies Record<Dimension, Record<WorldviewSignal, AxisDefinition>>;

function isDimension(value: unknown): value is Dimension {
  return (
    value === "field" || value === "ontology" || value === "phenomenology" || value === "teleology"
  );
}

function isSignal(value: unknown): value is WorldviewSignal {
  return value === "order" || value === "conflict" || value === "center" || value === "open";
}

function normalizeTopic(topic: string | undefined): string {
  const normalized = topic?.replace(/\s+/gu, " ").trim();
  return normalized === undefined || normalized.length === 0 ? "未命名议题" : normalized;
}

function collectSignals(
  dimensions: readonly WorldviewDimensionInput[],
): Record<Dimension, WorldviewSignal> {
  if (dimensions.length !== DIMENSION_ORDER.length) {
    throw new RangeError("世界观身份需要且只接受四个维度。");
  }

  const collected = new Map<Dimension, WorldviewSignal>();
  for (const entry of dimensions) {
    if (!isDimension(entry.dimension) || !isSignal(entry.signal)) {
      throw new TypeError("维度或信号不在世界观身份的有效范围内。");
    }
    if (collected.has(entry.dimension)) {
      throw new RangeError(`维度 ${entry.dimension} 不能重复。`);
    }
    collected.set(entry.dimension, entry.signal);
  }

  const required = (dimension: Dimension): WorldviewSignal => {
    const signal = collected.get(dimension);
    if (signal === undefined) {
      throw new RangeError(`缺少维度 ${dimension}。`);
    }
    return signal;
  };

  return {
    field: required("field"),
    ontology: required("ontology"),
    phenomenology: required("phenomenology"),
    teleology: required("teleology"),
  };
}

function createAxis(key: Dimension, signal: WorldviewSignal): WorldviewAxis {
  const values = SIGNAL_VALUES[signal];
  const definition = AXIS_DEFINITIONS[key][signal];
  return {
    key,
    label: DIMENSION_LABELS[key],
    value: values.emblem,
    digit: values.digit,
    stateName: definition.stateName,
    description: definition.description,
  };
}

/**
 * Creates a deterministic, topic-scoped identity from one signal per worldview dimension.
 *
 * This is deliberately a shareable interpretation rather than a personality or clinical
 * diagnosis. Input order never changes the resulting code, name, axes, or emblem.
 */
export function createWorldviewProfile(
  dimensions: readonly WorldviewDimensionInput[],
  topic?: string,
): WorldviewProfile {
  const signals = collectSignals(dimensions);
  const field = AXIS_DEFINITIONS.field[signals.field];
  const ontology = AXIS_DEFINITIONS.ontology[signals.ontology];
  const phenomenology = AXIS_DEFINITIONS.phenomenology[signals.phenomenology];
  const teleology = AXIS_DEFINITIONS.teleology[signals.teleology];
  const fieldValue = SIGNAL_VALUES[signals.field];
  const ontologyValue = SIGNAL_VALUES[signals.ontology];
  const phenomenologyValue = SIGNAL_VALUES[signals.phenomenology];
  const teleologyValue = SIGNAL_VALUES[signals.teleology];
  const archetype = ARCHETYPE_DEFINITIONS[signals.field][signals.teleology];
  const archetypeFamily = ARCHETYPE_FAMILIES[signals.field];

  const code: WorldviewCode = `${fieldValue.digit}–${ontologyValue.digit}–${phenomenologyValue.digit}–${teleologyValue.digit}`;
  const name = `${field.nameToken}${ontology.nameToken}·${phenomenology.nameToken}${teleology.nameToken}主义`;
  const tagline = `${field.taglinePart}，${phenomenology.taglinePart}${ontology.taglinePart}，再${teleology.taglinePart}。`;
  const normalizedTopic = normalizeTopic(topic);
  const scopeNote = `这份身份只绑定本次议题“${normalizedTopic}”；它是一种可修订的世界观姿态，不是固定人格，也不是临床诊断。`;
  const axes: WorldviewAxis[] = DIMENSION_ORDER.map((key) => createAxis(key, signals[key]));
  const emblem = [
    fieldValue.emblem,
    ontologyValue.emblem,
    phenomenologyValue.emblem,
    teleologyValue.emblem,
  ] as const;
  const traits = [field.trait, ontology.trait, phenomenology.trait, teleology.trait] as const;
  const blindSpot = `提醒：${field.blindSpot}；${teleology.blindSpot}。`;
  const topicCharacters = Array.from(normalizedTopic);
  const shareTopic =
    topicCharacters.length > 36 ? `${topicCharacters.slice(0, 36).join("")}…` : normalizedTopic;
  const shareText = `在“${shareTopic}”上，我是【${archetype.title}】· ${name}（${code}）。\n${archetype.line}\n${tagline}\n${axes
    .map((axis) => axis.stateName)
    .join(" · ")}\n只描述这次议题，不是固定人格。`;

  return {
    code,
    name,
    archetypeTitle: archetype.title,
    archetypeFamily,
    archetypeLine: archetype.line,
    tagline,
    topic: normalizedTopic,
    axes,
    emblem,
    traits,
    blindSpot,
    scopeNote,
    shareText,
  };
}
