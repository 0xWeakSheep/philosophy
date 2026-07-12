import { randomUUID } from "node:crypto";

import { DomainError } from "./errors";
import { assessSafety } from "./safety";
import type {
  AnswerSuggestion,
  AnswerSuggestionLens,
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

export const PROMPT_VERSION = "mirror-local-2026-07-12.1";

const NORMATIVE_MARKERS = [
  "只要足够努力",
  "为自己的选择负责",
  "只归因于努力",
  "意识决定",
  "观念决定",
  "物质决定",
  "环境决定",
  "制度决定",
  "本质上",
  "客观事实",
  "人性就是",
  "真正的自由",
  "现实就是",
  "归根结底",
  "天生",
  "注定",
  "本来就应该",
  "必须",
  "应当",
  "应该",
  "不应该",
  "不该",
  "正常",
  "总是",
  "从不",
  "至少",
  "不能",
] as const;

const EXTERNAL_CONDITION_TERMS = [
  "资源",
  "出身",
  "贫困",
  "收入",
  "教育",
  "制度",
  "政策",
  "法律",
  "规则",
  "算法",
  "平台",
  "技术",
  "机器",
  "AI",
  "人工智能",
  "身体",
  "疾病",
  "阶层",
  "历史",
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
  field: "现实的前置条件",
  ontology: "什么算作真实",
  phenomenology: "证据如何进入判断",
  teleology: "改变从哪里发生",
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
    return clip(firstClause, 28) || "这个还没说清的判断";
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
  const rule = clause
    .replace(/^(?:但|却|而|可是|我仍|我也)?(?:觉得|认为|相信)/u, "")
    .replace(/^(?:我)?(?:却|但|还是|总是)?(?:告诉|提醒|要求|劝)自己/u, "")
    .trim();
  return clip(rule || clause, 36);
}

export function extractTopic(input: string, marker: string): string {
  const firstClause = clip(input.split(/[。！？\n]/u)[0] ?? input, 54);
  if (NORMATIVE_MARKERS.some((candidate) => marker.includes(candidate))) {
    return `围绕“${marker}”，看清你把因果起点放在哪里`;
  }

  return `从“${firstClause}”出发，分开观念、选择与现实条件`;
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
        content: `先停在“${marker}”这句话上：在任何人作出选择之前，哪些物质条件、制度规则或共同观念已经先一步存在？`,
      };
    case 2:
      return {
        dimension,
        content:
          "这件事里，什么即使没人承认也会继续起作用，什么只有被理解、相信或承诺后才会成为现实？",
      };
    case 3:
      return {
        dimension,
        content:
          "回到你形成判断的第一刻：你先看见了人的动机与选择，还是资源、位置和限制；后来有什么证据让你修正，或更确信原来的解释？",
      };
    case 4:
      return {
        dimension,
        content: `你刚才写到“${latestUserQuote(messages)}”。如果只能改变一个变量，你会先改人的观念与意愿，还是资源、规则与激励；它会通过什么机制改变结果？`,
      };
    default:
      return {
        dimension,
        content: "谁有能力把自己的解释变成规则，而这套解释一旦失败，成本主要由谁承担？",
      };
  }
}

function localSuggestion(
  questionIndex: number,
  lens: AnswerSuggestionLens,
  content: string,
): AnswerSuggestion {
  return {
    id: `local-${questionIndex}-${lens}`,
    lens,
    content,
  };
}

/**
 * Immediate, deterministic options for the currently visible question.
 *
 * They deliberately keep four different causal starting points in view. The
 * language provider may later replace them, but a slow or missing provider
 * must never leave the user facing an empty typing-only state.
 */
export function localAnswerSuggestionsFor(
  questionIndex: number,
  marker: string,
  messages: readonly MirrorMessage[],
): AnswerSuggestion[] {
  switch (questionIndex) {
    case 1:
      return [
        localSuggestion(
          questionIndex,
          "conditions",
          "我会先看资源、身体和制度规则，因为它们在个人选择之前就限定了可选项。",
        ),
        localSuggestion(
          questionIndex,
          "agency",
          "我会先看共同观念和社会期待，因为它们会影响人如何理解处境、想象可能性。",
        ),
        localSuggestion(
          questionIndex,
          "integrated",
          "我认为条件决定行动成本，观念决定人怎样回应，二者会在具体选择里相互作用。",
        ),
        localSuggestion(
          questionIndex,
          "uncertain",
          `我暂时分不清“${clip(marker, 18)}”是现实限制，还是被反复相信后形成的规则。`,
        ),
      ];
    case 2:
      return [
        localSuggestion(
          questionIndex,
          "conditions",
          "我认为资源、身体和技术限制即使没人承认，也会继续产生后果。",
        ),
        localSuggestion(
          questionIndex,
          "agency",
          "我认为身份、公平和承诺需要被理解与共同相信，才会成为社会现实。",
        ),
        localSuggestion(
          questionIndex,
          "integrated",
          "我认为观念可以沉淀成制度，制度又会产生不依赖个人意愿的现实后果。",
        ),
        localSuggestion(
          questionIndex,
          "uncertain",
          "我更容易相信可观察的结果，但还不确定它能否完整解释意义和责任。",
        ),
      ];
    case 3:
      return [
        localSuggestion(
          questionIndex,
          "conditions",
          "我最先注意到资源、位置和结果差异，之后才把个人动机放进解释。",
        ),
        localSuggestion(
          questionIndex,
          "agency",
          "我先看人的意图和选择，再用事实与数据检查这种解释是否站得住。",
        ),
        localSuggestion(
          questionIndex,
          "integrated",
          "我会同时比较人的选择和所处条件，最能动摇我的是持续出现的反例。",
        ),
        localSuggestion(
          questionIndex,
          "uncertain",
          "我常凭第一印象形成判断，还没想清哪一种证据足以让我改口。",
        ),
      ];
    case 4:
      return [
        localSuggestion(
          questionIndex,
          "conditions",
          "我会先改规则、资源或激励，因为它们能直接改变人面对的可选项。",
        ),
        localSuggestion(
          questionIndex,
          "agency",
          "我会先改理解和意愿，因为行动方式要先从人如何看待处境开始变化。",
        ),
        localSuggestion(
          questionIndex,
          "integrated",
          "我会同时做一个最小规则调整和一个观念实验，比较哪一边先带来结果。",
        ),
        localSuggestion(
          questionIndex,
          "uncertain",
          `我需要先确认“${latestUserQuote(messages)}”里哪一层是瓶颈，否则改变任何一边都可能无效。`,
        ),
      ];
    default:
      return [
        localSuggestion(
          questionIndex,
          "conditions",
          "我会先看谁掌握资源和规则制定权，因为他们更容易把解释变成现实。",
        ),
        localSuggestion(
          questionIndex,
          "agency",
          "我认为多数人的共同相信也能形成规则，但这不代表结果一定公平。",
        ),
        localSuggestion(
          questionIndex,
          "integrated",
          "我会同时看谁能定义问题、谁能拒绝，以及失败成本最终落在谁身上。",
        ),
        localSuggestion(
          questionIndex,
          "uncertain",
          "我还需要知道谁拥有退出权和议价能力，才能判断责任与成本是否对称。",
        ),
      ];
  }
}

export function ensureLocalAnswerSuggestions(session: MirrorSession): MirrorSession {
  const hasOpenQuestion =
    (session.stage === "topic_confirm" || session.stage === "questioning") &&
    session.questionIndex < session.totalQuestions;
  if (!hasOpenQuestion) {
    return session.suggestions.length === 0 ? session : { ...session, suggestions: [] };
  }
  if (session.suggestions.length >= 3) {
    return session;
  }
  return {
    ...session,
    suggestions: localAnswerSuggestionsFor(
      session.questionIndex + 1,
      session.marker,
      session.messages,
    ),
  };
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
    suggestions: [],
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
    suggestions: localAnswerSuggestionsFor(1, marker, [intakeMessage]),
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

  return ensureLocalAnswerSuggestions({
    ...session,
    topic,
    stage: "questioning",
    updatedAt: now.toISOString(),
  });
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
    field: "你把选择放进了它发生之前的条件里",
    ontology: "你在区分不依赖相信的事实与依赖共同承认的现实",
    phenomenology: "你的判断从某类线索开始，也为其他证据留下了位置",
    teleology: "你把改变首先放在一个具体的作用变量上",
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
    order: (text.match(/规律|客观|事实|必然|制度|规则|机制|因果|数据|资源/gu) ?? []).length,
    conflict: (text.match(/但是|可是|一边|另一边|矛盾|冲突|又|却|不确定|同时/gu) ?? []).length,
    center: (text.match(/意志|选择|意识|观念|动机|自由|责任|相信|理解|意义/gu) ?? []).length,
    open: (text.match(/不知道|说不清|也许|可能|未知|证据|例外|无法|怀疑|动摇/gu) ?? []).length,
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
  if (/(?:资源|出身|贫困|收入|经济|教育|家庭|阶层)/u.test(text)) {
    factors.push("资源、教育与起点怎样改变可选项和行动成本");
  }
  if (/(?:制度|政策|法律|规则|公司|学校|组织|平台|算法)/u.test(text)) {
    factors.push("正式规则与实际激励是否把结果推向了某个方向");
  }
  if (/(?:身体|疾病|年龄|技术|机器|AI|人工智能)/iu.test(text)) {
    factors.push("身体与技术条件中，哪些限制不会因改变想法而消失");
  }
  if (/(?:权力|身份|性别|阶层|控制|威胁|暴力|话语权)/u.test(text)) {
    factors.push("谁拥有定义问题、制定规则和退出的权力");
  }
  if (/(?:历史|传统|路径|过去|长期)/u.test(text)) {
    factors.push("历史路径和已有成本怎样限制当下能够改变的范围");
  }
  if (factors.length === 0) {
    factors.push("哪些物质或身体限制不会因改变想法而消失");
    factors.push("谁拥有制定规则、分配机会和承担失败成本的权力");
    factors.push("哪些共同观念已经沉淀成制度，并产生现实后果");
  }
  return factors;
}

type WorldviewOrientation = "agency" | "conditions" | "layered";

function inferWorldviewOrientation(text: string): WorldviewOrientation {
  const agencyScore = (
    text.match(/观念|意识|意志|选择|努力|动机|自由|责任|相信|理解|意义|态度|想法/gu) ?? []
  ).length;
  const conditionScore = (
    text.match(/资源|条件|出身|制度|结构|身体|技术|规则|激励|权力|环境|阶层|数据|物质|经济/gu) ?? []
  ).length;

  if (agencyScore - conditionScore >= 2) return "agency";
  if (conditionScore - agencyScore >= 2) return "conditions";
  return "layered";
}

const ORIENTATION_COPY = {
  agency: {
    title: "这次判断更接近观念与选择优先",
    interpretation:
      "如果借用唯心与唯物这组词，你这次更先相信人的理解、意志和选择具有因果力量。这不等于你否认物质现实。",
    core: "在这次议题里，你先从观念与选择解释结果。边界在于：哪些条件不会因想法改变而消失。",
  },
  conditions: {
    title: "这次判断更接近物质条件优先",
    interpretation:
      "如果借用唯心与唯物这组词，你这次更先把选择发生之前的条件放进因果链。这不等于宿命，也不等于人无需负责。",
    core: "在这次议题里，你先从前置条件解释结果。边界在于：你仍愿意为人的选择保留多少作用。",
  },
  layered: {
    title: "这次判断呈现出分层因果",
    interpretation:
      "你没有把结果完全交给观念或条件。观念组织行动，条件限定可能性，共同观念又可能沉淀成制度。单一标签暂时装不下这条因果链。",
    core: "你没有把结果完全交给观念或条件。你真正关心的是：哪一层先改变，另一层才会跟着动。",
  },
} as const satisfies Record<
  WorldviewOrientation,
  { readonly title: string; readonly interpretation: string; readonly core: string }
>;

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
  const orientation = inferWorldviewOrientation(allText);
  const orientationCopy = ORIENTATION_COPY[orientation];

  const hypotheses: Hypothesis[] = [
    {
      id: randomUUID(),
      title: orientationCopy.title,
      interpretation: orientationCopy.interpretation,
      evidence: [
        evidenceNode(field, "这句话显示你如何安排选择发生之前的条件。"),
        evidenceNode(teleology, "这句话显示你认为改变应该先落在哪一层。"),
      ],
      counterEvidence: [
        evidenceNode(ontology, "这句话可能支持另一种因果起点，仍需要把作用机制说清。"),
      ],
      stance: "unreviewed",
    },
    {
      id: randomUUID(),
      title: "你的责任判断没有完全跟着因果判断走",
      interpretation:
        "什么造成了结果，与谁仍应为选择负责，并不是同一个问题。你的表达可能在两者之间保留了一段没有被抹平的张力。",
      evidence: [
        evidenceNode(ontology, "这句话显示你为真实、主体或责任保留了什么位置。"),
        evidenceNode(teleology, "这句话显示责任如何影响你选择改变的变量。"),
      ],
      counterEvidence: [
        evidenceNode(phenomenology, "这句话也可能只是在描述因果证据，你未必已经作出责任判断。"),
      ],
      stance: "unreviewed",
    },
    {
      id: randomUUID(),
      title: "真正的边界可能在什么才算有效证据",
      interpretation:
        "当直觉、个案、数据和机制互相冲突时，你愿意让哪一种证据推翻原判断，比主义名称更能说明这次世界观倾向。",
      evidence: [evidenceNode(phenomenology, "这句话显示什么线索最先进入了你的判断。")],
      counterEvidence: [
        evidenceNode(field, "这句话提醒我们，证据本身也可能受资源、位置和制度影响。"),
      ],
      stance: "unreviewed",
    },
  ];

  return {
    coreTension: orientationCopy.core,
    hypotheses,
    dimensions: [
      dimensionReading(session.messages, "field", 1),
      dimensionReading(session.messages, "ontology", 2),
      dimensionReading(session.messages, "phenomenology", 3),
      dimensionReading(session.messages, "teleology", 4),
    ],
    uncertainties: [
      "这些读法只绑定本次议题。换一个问题，你的因果起点可能完全不同。",
      "强调个人责任不自动等于观念优先，看到资源限制也不自动等于物质优先。",
      "同时提到观念和条件还不等于解释了机制，仍要说明它们怎样作用，以及哪一层先发生变化。",
    ],
    nextQuestion:
      "下一次形成判断时，先记下第一反应：你先看见了人的意图，还是选择发生之前的条件？再问一句，什么证据会让你换边？",
    window: {
      externalFactors: findExternalFactors(allText),
      question:
        "把解释放回现实：谁拥有资源、规则制定权和退出权，哪些成本不会因为换一种想法就消失？",
      note: "这扇窗抵抗两种简化：把结构问题缩成个人心态，也把人的具体选择全部交给结构解释。",
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
    suggestions: [],
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
    suggestions: [],
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
    suggestions: localAnswerSuggestionsFor(nextQuestionNumber, session.marker, withAnswer.messages),
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
    title: "把背景变成原因",
    label: "条件不再只是背景",
    signal: "暂时把资源、身体、技术与制度放到个人选择之前，观察原判断是否仍然成立。",
    prompt: "如果先改变条件，而不要求任何人改变想法，结果会怎样变化？",
    observation: "只改变因果起点。责任判断与价值判断先保持原样，看看原来的解释还剩多少。",
  },
  ontology: {
    title: "换一种真实标准",
    label: "区分物质事实与社会事实",
    signal: "暂时把不依赖相信的事实，与依靠共同承认才成立的现实分开。",
    prompt: "你在意的东西若无人承认仍会存在，还是必须依靠共同相信才能起作用？",
    observation: "只改变什么算作真实。因果顺序先不动，观察原判断依赖的是哪一种存在。",
  },
  phenomenology: {
    title: "更换证据入口",
    label: "让最强反例先进入判断",
    signal: "暂时给一条最不符合原判断的证据同等权重，不急着保护原来的结论。",
    prompt: "如果先看最强反例，再看支持材料，你还会用同一种方式解释这件事吗？",
    observation: "只改变证据顺序。事实本身不变，观察你的确信来自证据，还是来自最先形成的框架。",
  },
  teleology: {
    title: "更换改变杠杆",
    label: "先改变另一层变量",
    signal: "如果原先想改变观念，就先改规则与激励；如果原先想改条件，就先改理解与意愿。",
    prompt: "只换这一个变量，结果会通过什么具体机制发生变化？",
    observation: "只改变干预位置。观察另一层是否真的会跟着改变，还是暴露出原解释缺少的一环。",
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
