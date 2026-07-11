import { randomUUID } from "node:crypto";

import { DomainError } from "./errors";
import { assessSafety } from "./safety";
import type {
  CounterfactualExperiment,
  Dimension,
  DimensionReading,
  EvidenceNode,
  Hypothesis,
  HypothesisStance,
  MirrorMessage,
  MirrorSession,
  RiskFlag,
  SessionResult,
} from "./schemas";

export const PROMPT_VERSION = "mirror-local-2026-07-11.1";

const NORMATIVE_MARKERS = [
  "成年人就应该",
  "成熟的人应该",
  "真正爱一个人",
  "如果在乎就会",
  "本来就应该",
  "必须",
  "应该",
  "不应该",
  "不该",
  "正常",
  "成熟",
  "懂事",
  "总是",
  "从不",
  "至少",
  "不能",
  "不配",
] as const;

const EXTERNAL_CONDITION_TERMS = [
  "控制",
  "威胁",
  "暴力",
  "上司",
  "领导",
  "公司",
  "经济",
  "钱",
  "家长",
  "身份",
  "权力",
] as const;

const DIMENSION_LABELS = {
  field: "关系的默认规则",
  ontology: "不可退让之物",
  phenomenology: "经验如何出现",
  teleology: "行动实际指向",
} as const satisfies Record<Dimension, string>;

const normalizeWhitespace = (text: string): string => text.replace(/\s+/gu, " ").trim();

const clip = (text: string, length: number): string => {
  const normalized = normalizeWhitespace(text);
  return normalized.length <= length ? normalized : `${normalized.slice(0, length - 1)}…`;
};

function makeMessage(
  role: "user" | "mirror",
  content: string,
  createdAt: string,
  dimension?: Dimension,
): MirrorMessage {
  return {
    id: randomUUID(),
    role,
    content,
    createdAt,
    ...(dimension === undefined ? {} : { dimension }),
  };
}

export function extractMarker(input: string): string {
  const normalized = normalizeWhitespace(input);
  const marker = NORMATIVE_MARKERS.find((candidate) => normalized.includes(candidate));

  if (marker === undefined) {
    const firstClause = normalized.split(/[。！？；，]/u)[0] ?? normalized;
    return clip(firstClause, 28) || "这件反复发生的事";
  }

  const markerIndex = normalized.indexOf(marker);
  const clauseBreaks = /[，。！？；\n]/u;
  const prefix = normalized.slice(0, markerIndex);
  const previousBreak = Math.max(
    prefix.lastIndexOf("，"),
    prefix.lastIndexOf("。"),
    prefix.lastIndexOf("！"),
    prefix.lastIndexOf("？"),
    prefix.lastIndexOf("；"),
  );
  const suffix = normalized.slice(markerIndex);
  const nextBreakInSuffix = suffix.search(clauseBreaks);
  const clauseEnd = nextBreakInSuffix < 0 ? normalized.length : markerIndex + nextBreakInSuffix;
  const clause = normalized.slice(previousBreak + 1, clauseEnd).trim();
  const rule = clause.replace(/^(?:我)?(?:却|但|还是|总是)?(?:告诉|提醒|要求|劝)自己/u, "").trim();
  return clip(rule || clause, 36);
}

export function extractTopic(input: string, marker: string): string {
  const firstClause = clip(input.split(/[。！？\n]/u)[0] ?? input, 54);
  if (NORMATIVE_MARKERS.some((candidate) => marker.includes(candidate))) {
    return `围绕“${marker}”，看清这条关系规则在保护什么`;
  }

  return `在“${firstClause}”里，看清你真正想保护的东西`;
}

function countQuestions(input: string): 4 | 5 {
  return EXTERNAL_CONDITION_TERMS.some((term) => input.includes(term)) ? 5 : 4;
}

function dimensionForQuestion(index: number): Dimension {
  if (index === 1 || index === 5) {
    return "field";
  }
  if (index === 2) {
    return "ontology";
  }
  if (index === 3) {
    return "phenomenology";
  }
  return "teleology";
}

function latestUserQuote(messages: readonly MirrorMessage[]): string {
  const latest = [...messages].reverse().find((message) => message.role === "user");
  return latest === undefined
    ? "你刚才写下的那句话"
    : clip(latest.content, 30).replace(/[，。！？；：]+$/u, "");
}

export function questionFor(
  index: number,
  marker: string,
  messages: readonly MirrorMessage[],
): { readonly content: string; readonly dimension: Dimension } {
  const dimension = dimensionForQuestion(index);
  switch (index) {
    case 1:
      return {
        dimension,
        content: `先停在“${marker}”这句话上。如果它不再是一条理所当然的规则，你最担心这段关系会变成什么样？`,
      };
    case 2:
      return {
        dimension,
        content:
          "这件事里，哪一样东西一旦失去，就会让这段关系对你来说不再成立？请只说最不能退让的那一个。",
      };
    case 3:
      return {
        dimension,
        content:
          "当那一刻发生时，你最先出现的是一种身体感受、一句解释，还是一个想立刻做的动作？请停在最先出现的那个瞬间。",
      };
    case 4:
      return {
        dimension,
        content: `你刚才写到“${latestUserQuote(messages)}”。当你那样反应时，你更像是在保护什么，还是在避免什么？`,
      };
    default:
      return {
        dimension,
        content:
          "现在把镜子转向窗外。如果暂时不把问题放在你身上，对方的选择、权力差或现实条件中，哪一项也应该承担解释？",
      };
  }
}

function createSafetySession(
  id: string,
  input: string,
  riskFlags: readonly RiskFlag[],
  safetyMessage: string,
  now: string,
): MirrorSession {
  return {
    id,
    stage: "safety_stop",
    topic: "先照顾此刻的安全",
    intake: input,
    marker: "此刻的安全",
    questionIndex: 0,
    totalQuestions: 4,
    messages: [makeMessage("user", input, now), makeMessage("mirror", safetyMessage, now)],
    riskFlags: [...riskFlags],
    safetyMessage,
    experiments: [],
    provider: "local",
    promptVersion: PROMPT_VERSION,
    createdAt: now,
    updatedAt: now,
  };
}

export function createLocalSession(input: string, now = new Date()): MirrorSession {
  const timestamp = now.toISOString();
  const id = randomUUID();
  const safety = assessSafety(input);
  if (!safety.safe && safety.message !== undefined) {
    return createSafetySession(id, input, safety.riskFlags, safety.message, timestamp);
  }

  const marker = extractMarker(input);
  const topic = extractTopic(input, marker);
  const totalQuestions = countQuestions(input);
  const intakeMessage = makeMessage("user", input, timestamp);
  const firstQuestion = questionFor(1, marker, [intakeMessage]);

  return {
    id,
    stage: "topic_confirm",
    topic,
    intake: input,
    marker,
    questionIndex: 0,
    totalQuestions,
    messages: [
      intakeMessage,
      makeMessage("mirror", firstQuestion.content, timestamp, firstQuestion.dimension),
    ],
    riskFlags: [],
    experiments: [],
    provider: "local",
    promptVersion: PROMPT_VERSION,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function confirmSessionTopic(
  session: MirrorSession,
  topic: string,
  now = new Date(),
): MirrorSession {
  if (session.stage === "safety_stop") {
    throw new DomainError("这次探索已因安全风险暂停。", "INVALID_STAGE", 409);
  }
  if (session.stage === "result" || session.stage === "feedback") {
    throw new DomainError("结果生成后不能再修改本次议题。", "INVALID_STAGE", 409);
  }

  return {
    ...session,
    topic,
    stage: "questioning",
    updatedAt: now.toISOString(),
  };
}

function userMessages(messages: readonly MirrorMessage[]): MirrorMessage[] {
  return messages.filter((message) => message.role === "user");
}

function byDimension(
  messages: readonly MirrorMessage[],
  dimension: Dimension,
): MirrorMessage | undefined {
  return messages.find((message) => message.role === "user" && message.dimension === dimension);
}

function fallbackMessage(
  messages: readonly MirrorMessage[],
  preferredIndex: number,
): MirrorMessage {
  const users = userMessages(messages);
  const preferred = users[preferredIndex] ?? users.at(-1) ?? users[0];
  if (preferred === undefined) {
    throw new DomainError("会话中没有可用于生成结果的表达。", "CONFLICT", 409);
  }
  return preferred;
}

function evidenceNode(message: MirrorMessage, note: string): EvidenceNode {
  return {
    id: randomUUID(),
    quote: clip(message.content, 110),
    sourceMessageId: message.id,
    note,
  };
}

function dimensionReading(
  messages: readonly MirrorMessage[],
  dimension: Dimension,
  fallbackIndex: number,
): DimensionReading {
  const message = byDimension(messages, dimension);
  const source = message ?? fallbackMessage(messages, fallbackIndex);
  const prefixes = {
    field: "你把这句话放在关系能否成立的背景里",
    ontology: "你把这件事靠近了一个不可轻易协商的核心",
    phenomenology: "你的经验先以感受、解释或动作向你显现",
    teleology: "你的反应不只是在回应当下，也在朝某个方向用力",
  } as const satisfies Record<Dimension, string>;

  const signal = inferDimensionSignal(source.content);

  return {
    dimension,
    label: DIMENSION_LABELS[dimension],
    signal,
    observation: `${prefixes[dimension]}：“${clip(source.content, 44)}”`,
    confidence: message === undefined ? "low" : "medium",
  };
}

function inferDimensionSignal(text: string): "order" | "conflict" | "center" | "open" {
  const scores = {
    order: (text.match(/应该|必须|规则|稳定|正常|承诺|一直|至少|约定|本来/gu) ?? []).length,
    conflict: (text.match(/但是|可是|一边|另一边|矛盾|冲突|又|却|怕|希望|不要|避免/gu) ?? [])
      .length,
    center: (text.match(/最不能|不可退让|核心|底线|失去|重要|认真对待|不再成立/gu) ?? []).length,
    open: (text.match(/不知道|说不清|也许|可能|不确定|无法|沉默|空|算了/gu) ?? []).length,
  };
  const ranked = Object.entries(scores).sort((left, right) => right[1] - left[1]);
  const first = ranked[0];
  if (first === undefined || first[1] === 0) {
    return "open";
  }
  return first[0] as "order" | "conflict" | "center" | "open";
}

function findExternalFactors(text: string): string[] {
  const factors: string[] = [];
  if (/(?:控制|威胁|暴力|羞辱|强迫)/u.test(text)) {
    factors.push("控制、威胁或现实边界是否被侵犯");
  }
  if (/(?:上司|领导|公司|工作|职位|学校|老师)/u.test(text)) {
    factors.push("组织角色带来的权力差");
  }
  if (/(?:钱|经济|收入|房租|债务|资源)/u.test(text)) {
    factors.push("经济与资源约束");
  }
  if (/(?:父母|家长|家庭|孩子|长辈)/u.test(text)) {
    factors.push("家庭角色与代际期待");
  }
  if (factors.length === 0) {
    factors.push("对方是否持续承担承诺与沟通责任");
    factors.push("关系中的决定权和退路是否对等");
  }
  return factors;
}

function extractCoreValue(text: string): string {
  const normalized = normalizeWhitespace(text);
  const explicit = normalized.match(
    /(?:最不能退让的|最不能失去的|不能失去的|最重要的|我最在意的)(?:是|就是)([^，。！？；]{2,28})/u,
  )?.[1];
  if (explicit !== undefined) {
    return clip(explicit, 24);
  }

  const firstClause = normalized.split(/[，。！？；]/u)[0] ?? normalized;
  return clip(firstClause.replace(/^我(?:觉得|担心|希望|想要)?/u, ""), 24);
}

export function buildSessionResult(session: MirrorSession, now = new Date()): SessionResult {
  const field = byDimension(session.messages, "field") ?? fallbackMessage(session.messages, 1);
  const ontology =
    byDimension(session.messages, "ontology") ?? fallbackMessage(session.messages, 2);
  const phenomenology =
    byDimension(session.messages, "phenomenology") ?? fallbackMessage(session.messages, 3);
  const teleology =
    byDimension(session.messages, "teleology") ?? fallbackMessage(session.messages, 4);
  const allText = userMessages(session.messages)
    .map((message) => message.content)
    .join("\n");

  const hypotheses: Hypothesis[] = [
    {
      id: randomUUID(),
      title: "你在保护的也许是一条关系规则",
      interpretation: `触发你的可能不只是一次事件，而是“${session.marker}”背后的规则没有被共同承认。`,
      evidence: [
        evidenceNode(field, "这句话支撑了你对关系背景和默认规则的描述。"),
        evidenceNode(ontology, "这句话显示了规则背后不可轻易退让的东西。"),
      ],
      counterEvidence: [
        evidenceNode(teleology, "这句话也可能说明，你首先在处理一个现实边界，而不是维护抽象规则。"),
      ],
      stance: "unreviewed",
    },
    {
      id: randomUUID(),
      title: "感受之后，另一套自我要求可能紧跟着出现",
      interpretation: "你不仅在经历这件事，也可能在判断自己的感受是否足够合理、成熟或值得被看见。",
      evidence: [
        evidenceNode(phenomenology, "这句话保留了经验最先出现的方式，而不是事后的完整解释。"),
      ],
      counterEvidence: [
        evidenceNode(
          ontology,
          "这句话也支持另一种读法：你的感受可能在回应真实损失，并非来自自我要求。",
        ),
      ],
      stance: "unreviewed",
    },
    {
      id: randomUUID(),
      title: "行动可能同时在争取被看见和避免失去关系",
      interpretation:
        "同一个反应里可以有两股力量：一股想让重要之物被承认，另一股想避免局面走到无法挽回。",
      evidence: [evidenceNode(teleology, "这句话呈现了行动实际保护或回避的方向。")],
      counterEvidence: [
        evidenceNode(field, "这句话也可能说明你的方向很单一，只是在要求一条清楚边界。"),
      ],
      stance: "unreviewed",
    },
  ];

  return {
    coreTension: `你似乎既在保护“${extractCoreValue(ontology.content)}”，又在用“${session.marker}”审查自己的感受。`,
    hypotheses,
    dimensions: [
      dimensionReading(session.messages, "field", 1),
      dimensionReading(session.messages, "ontology", 2),
      dimensionReading(session.messages, "phenomenology", 3),
      dimensionReading(session.messages, "teleology", 4),
    ],
    uncertainties: [
      "这些读法只绑定本次议题，还不能说明你在其他关系里也会如此。",
      "目前仍无法确定，张力主要来自你的自我要求，还是来自一条确实被破坏的现实边界。",
    ],
    nextQuestion:
      "下一次相似时刻出现时，先不要解释自己。只观察：你最先想维护的是规则、关系，还是不再被忽略的自己？",
    window: {
      externalFactors: findExternalFactors(allText),
      question:
        "如果暂时不把原因放在你身上，对方的选择、权力差或现实条件中，哪一项也应当承担解释？",
      note: "这扇窗用于检查外部现实，避免把所有问题都内化成你的认知结构。",
    },
    durationSeconds: Math.max(
      1,
      Math.floor((now.getTime() - Date.parse(session.createdAt)) / 1000),
    ),
    generatedAt: now.toISOString(),
  };
}

function safetyStopFromAnswer(
  session: MirrorSession,
  answer: string,
  riskFlags: readonly RiskFlag[],
  safetyMessage: string,
  now: Date,
): MirrorSession {
  const timestamp = now.toISOString();
  const currentDimension = dimensionForQuestion(session.questionIndex + 1);
  return {
    ...session,
    stage: "safety_stop",
    messages: [
      ...session.messages,
      makeMessage("user", answer, timestamp, currentDimension),
      makeMessage("mirror", safetyMessage, timestamp),
    ],
    riskFlags: [...new Set([...session.riskFlags, ...riskFlags])],
    safetyMessage,
    updatedAt: timestamp,
  };
}

export function advanceLocalSession(
  session: MirrorSession,
  answer: string,
  now = new Date(),
): MirrorSession {
  if (session.stage === "safety_stop") {
    throw new DomainError("这次探索已因安全风险暂停。", "INVALID_STAGE", 409);
  }
  if (session.stage === "result" || session.stage === "feedback") {
    throw new DomainError("本次探索已经生成结果。", "INVALID_STAGE", 409);
  }

  const safety = assessSafety(answer);
  if (!safety.safe && safety.message !== undefined) {
    return safetyStopFromAnswer(session, answer, safety.riskFlags, safety.message, now);
  }

  const timestamp = now.toISOString();
  const currentDimension = dimensionForQuestion(session.questionIndex + 1);
  const answeredCount = session.questionIndex + 1;
  const withAnswer: MirrorSession = {
    ...session,
    stage: "questioning",
    messages: [...session.messages, makeMessage("user", answer, timestamp, currentDimension)],
    questionIndex: answeredCount,
    updatedAt: timestamp,
  };

  if (answeredCount >= session.totalQuestions) {
    const result = buildSessionResult(withAnswer, now);
    return {
      ...withAnswer,
      stage: "result",
      result,
      messages: [
        ...withAnswer.messages,
        makeMessage(
          "mirror",
          "我把刚才的线索分开摆好了。下面不是结论，而是三种可以被你反驳的临时读法。",
          timestamp,
        ),
      ],
    };
  }

  const nextQuestionNumber = answeredCount + 1;
  const nextQuestion = questionFor(nextQuestionNumber, session.marker, withAnswer.messages);
  return {
    ...withAnswer,
    messages: [
      ...withAnswer.messages,
      makeMessage("mirror", nextQuestion.content, timestamp, nextQuestion.dimension),
    ],
  };
}

export function updateHypothesisStance(
  session: MirrorSession,
  hypothesisId: string,
  stance: Exclude<HypothesisStance, "unreviewed">,
  note: string | undefined,
  now = new Date(),
): MirrorSession {
  if (session.result === undefined) {
    throw new DomainError("结果生成后才能回应这些读法。", "INVALID_STAGE", 409);
  }

  const exists = session.result.hypotheses.some((hypothesis) => hypothesis.id === hypothesisId);
  if (!exists) {
    throw new DomainError("没有找到这条临时读法。", "NOT_FOUND", 404);
  }

  const hypotheses = session.result.hypotheses.map((hypothesis) => {
    if (hypothesis.id !== hypothesisId) {
      return hypothesis;
    }
    const { stanceNote: _oldStanceNote, ...withoutStanceNote } = hypothesis;
    return {
      ...withoutStanceNote,
      stance,
      ...(note === undefined || note.length === 0 ? {} : { stanceNote: note }),
    };
  });

  return {
    ...session,
    result: { ...session.result, hypotheses },
    updatedAt: now.toISOString(),
  };
}

const EXPERIMENT_COPY = {
  field: {
    title: "移走一条默认规则",
    label: "关系不再由唯一规则兜底",
    signal: "暂时假设双方可以重新协商什么才算在乎，而不是先证明谁违背了标准。",
    prompt: "如果“在乎就必须以某种固定方式证明”不再成立，同一件事里你还会坚持什么？",
    observation: "只改变关系背景，其他感受与目标先保持原样。观察哪些愤怒仍然存在，哪些开始松动。",
  },
  ontology: {
    title: "松动一个不可退让之物",
    label: "核心之物暂时变成可协商",
    signal: "暂时假设你最不能失去的东西并非只有一种实现形式。",
    prompt: "如果你在意的东西仍可被保护，只是不必通过原来的方式证明，你会怎样重新描述这件事？",
    observation: "只改变对真实核心的理解，不要求你放弃边界。观察替代形式是否真的存在。",
  },
  phenomenology: {
    title: "让感受先于解释",
    label: "经验暂时不接受评判",
    signal: "让第一刻的身体感受和情绪先存在，不急着判断它是否成熟或合理。",
    prompt: "如果最先出现的感受不需要立刻通过解释，它想让你注意到什么？",
    observation: "只改变经验的组织方式，事实本身不变。观察你是否会听见此前被解释盖住的线索。",
  },
  teleology: {
    title: "换一个行动方向",
    label: "行动不再负责维持旧循环",
    signal: "暂时让下一步既不证明你是对的，也不负责阻止关系破裂。",
    prompt: "如果下一步只负责清楚表达边界，而不负责控制结果，你会做出哪个最小动作？",
    observation: "只改变行动指向，其他判断先不动。观察这会带来自由、恐惧，还是两者都有。",
  },
} as const satisfies Record<
  Dimension,
  {
    readonly title: string;
    readonly label: string;
    readonly signal: string;
    readonly prompt: string;
    readonly observation: string;
  }
>;

export function createCounterfactualExperiment(
  session: MirrorSession,
  dimension: Dimension,
  now = new Date(),
): { readonly experiment: CounterfactualExperiment; readonly session: MirrorSession } {
  if (session.result === undefined) {
    throw new DomainError("结果生成后才能进行一位之差实验。", "INVALID_STAGE", 409);
  }

  const reading = session.result.dimensions.find((candidate) => candidate.dimension === dimension);
  if (reading === undefined) {
    throw new DomainError("这个维度目前还没有足够线索。", "NOT_FOUND", 404);
  }

  const copy = EXPERIMENT_COPY[dimension];
  const experiment: CounterfactualExperiment = {
    id: randomUUID(),
    changedDimension: dimension,
    title: copy.title,
    before: `${reading.label}：${reading.observation}`,
    after: `${copy.label}：${copy.signal}`,
    prompt: copy.prompt,
    observation: copy.observation,
    createdAt: now.toISOString(),
  };

  return {
    experiment,
    session: {
      ...session,
      experiments: [...session.experiments, experiment],
      updatedAt: now.toISOString(),
    },
  };
}
