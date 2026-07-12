export type SessionStage =
  | "intake"
  | "topic_confirm"
  | "questioning"
  | "recap"
  | "result"
  | "feedback"
  | "safety_stop";

export type DimensionKey = "field" | "ontology" | "phenomenology" | "teleology";

export type ForceKey = "order" | "conflict" | "center" | "open";

export type HypothesisStance =
  | "unreviewed"
  | "resonates"
  | "partial"
  | "rejects"
  | "situational"
  | "counterexample";

export interface SessionMessage {
  id: string;
  role: "user" | "assistant" | "mirror";
  content: string;
  dimension?: DimensionKey;
}

export type AnswerSuggestionLens = "agency" | "conditions" | "integrated" | "uncertain";

export interface AnswerSuggestion {
  id: string;
  content: string;
  lens?: AnswerSuggestionLens;
}

export interface EvidenceItem {
  id: string;
  quote: string;
  sourceMessageId: string;
}

export interface Hypothesis {
  id: string;
  title: string;
  interpretation: string;
  evidence: EvidenceItem[];
  counterEvidence: EvidenceItem[];
  stance: HypothesisStance;
  stanceNote?: string;
}

export interface DimensionSignal {
  dimension: DimensionKey;
  label: string;
  signal: ForceKey;
  confidence: "low" | "medium" | "high";
  observation?: string;
}

export interface KnowledgeCitation {
  kind: "coordinate" | "lineage" | "framework";
  title: string;
  code?: string;
  sourcePath: string;
  excerpt: string;
}

export interface KnowledgeReading {
  code: string;
  title: string;
  summary: string;
  capabilities: string[];
  blindSpots: string[];
  prompts: string[];
  sources: KnowledgeCitation[];
}

export interface SessionResult {
  coreTension: string;
  hypotheses: Hypothesis[];
  dimensions: DimensionSignal[];
  knowledge?: KnowledgeReading;
  uncertainties: string[];
  nextQuestion: string;
  window: {
    externalFactors: string[];
    question: string;
  };
}

export interface MirrorSession {
  id: string;
  stage: SessionStage;
  topic: string;
  intake: string;
  marker: string;
  questionIndex: number;
  totalQuestions: number;
  messages: SessionMessage[];
  suggestions?: AnswerSuggestion[];
  result?: SessionResult;
  riskFlags?: string[];
}

export interface AnswerSuggestionsPayload {
  suggestions: AnswerSuggestion[];
  source: string | undefined;
}

export interface CounterfactualExperiment {
  changedDimension: DimensionKey;
  before: string | { label: string; signal: string };
  after: string | { label: string; signal: string };
  prompt: string;
  observation: string;
}

export function experimentLabel(
  value: CounterfactualExperiment["before"] | CounterfactualExperiment["after"],
): string {
  return typeof value === "string" ? value : `${value.label}：${value.signal}`;
}

export function unwrapSession(payload: unknown): MirrorSession {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("会话数据格式不正确");
  }

  const object = payload as Record<string, unknown>;
  const session = (object.session ?? object) as MirrorSession;
  if (typeof session.id !== "string" || !Array.isArray(session.messages)) {
    throw new Error("会话数据不完整");
  }
  return session;
}

export function unwrapAnswerSuggestions(payload: unknown): AnswerSuggestionsPayload {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("候选回答格式不正确");
  }

  const object = payload as Record<string, unknown>;
  if (!Array.isArray(object.suggestions)) {
    throw new Error("候选回答不完整");
  }

  const suggestions = object.suggestions.filter(
    (suggestion): suggestion is AnswerSuggestion =>
      typeof suggestion === "object" &&
      suggestion !== null &&
      typeof (suggestion as Record<string, unknown>).id === "string" &&
      typeof (suggestion as Record<string, unknown>).content === "string",
  );

  if (suggestions.length === 0) {
    throw new Error("候选回答暂时不可用");
  }

  return {
    suggestions: suggestions.slice(0, 4),
    source: typeof object.source === "string" ? object.source : undefined,
  };
}
