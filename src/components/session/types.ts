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
  plainLanguage?: string;
  example?: string;
  dimension?: DimensionKey;
}

export type AnswerSuggestionLens = "agency" | "conditions" | "integrated" | "uncertain";

export interface AnswerSuggestion {
  id: string;
  title?: string;
  content: string;
  example?: string;
  lens?: AnswerSuggestionLens;
}

export function suggestionAnswerText(suggestion: AnswerSuggestion): string {
  return suggestion.content;
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

export interface InterpretationLayer {
  title: string;
  summary: string;
}

export interface LayeredReading {
  surfacePhenomenon: InterpretationLayer;
  deepStructure: InterpretationLayer;
  realityGround: InterpretationLayer;
  observableExpression: InterpretationLayer;
}

export interface BreakthroughAction {
  kind: "observe" | "test" | "revise";
  title: string;
  instruction: string;
  completionSignal: string;
}

export interface BreakthroughClosure {
  focusDimension: DimensionKey;
  focusLabel: string;
  moveName: string;
  directRebuttal: {
    targetClaim: string;
    statement: string;
    reasoning: string;
    evidence: EvidenceItem & { note?: string };
    source?: KnowledgeCitation;
  };
  reframe: {
    from: string;
    to: string;
    hingeQuestion: string;
  };
  actions: [BreakthroughAction, BreakthroughAction, BreakthroughAction];
  uncertaintyBoundary: {
    confidence: "low" | "medium";
    supported: string;
    unknown: string;
    wouldChangeReading: string;
    scope: "current_topic_only";
  };
}

export interface PracticalProfile {
  canonicalName?: string;
  plainSummary: string;
  teamScenario: string;
  strengths: string[];
  blindSpots: string[];
  nameExplanation: string;
  verificationQuestion: string;
}

export interface SessionResult {
  coreTension: string;
  hypotheses: Hypothesis[];
  dimensions: DimensionSignal[];
  knowledge?: KnowledgeReading;
  practicalProfile?: PracticalProfile;
  layeredReading?: LayeredReading;
  breakthrough?: BreakthroughClosure;
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
  topicOrigin?: "derived" | "explicit";
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

  const suggestions = object.suggestions
    .filter(
      (suggestion): suggestion is Record<string, unknown> =>
        typeof suggestion === "object" &&
        suggestion !== null &&
        typeof (suggestion as Record<string, unknown>).id === "string" &&
        typeof (suggestion as Record<string, unknown>).content === "string",
    )
    .map(
      (suggestion): AnswerSuggestion => ({
        id: suggestion.id as string,
        ...(typeof suggestion.title === "string" ? { title: suggestion.title } : {}),
        content: suggestion.content as string,
        ...(typeof suggestion.example === "string" ? { example: suggestion.example } : {}),
        ...(suggestion.lens === "agency" ||
        suggestion.lens === "conditions" ||
        suggestion.lens === "integrated" ||
        suggestion.lens === "uncertain"
          ? { lens: suggestion.lens }
          : {}),
      }),
    );

  if (suggestions.length === 0) {
    throw new Error("候选回答暂时不可用");
  }

  return {
    suggestions: suggestions.slice(0, 4),
    source: typeof object.source === "string" ? object.source : undefined,
  };
}
