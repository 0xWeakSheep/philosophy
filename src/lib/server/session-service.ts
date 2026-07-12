import {
  advanceLocalSession,
  confirmSessionTopic,
  createCounterfactualExperiment,
  createLocalSession,
  ensureLocalAnswerSuggestions,
  updateHypothesisStance,
} from "../domain/engine";
import { DomainError } from "../domain/errors";
import { assessSafety } from "../domain/safety";
import type {
  AnswerSuggestion,
  CounterfactualExperiment,
  Dimension,
  HypothesisStance,
  MirrorMessage,
  MirrorSession,
  SessionFeedback,
  SessionResult,
} from "../domain/schemas";
import { AnswerSuggestionSchema } from "../domain/schemas";
import {
  createLanguageProviderFromEnv,
  type LanguageRefinement,
  type MirrorLanguageProvider,
} from "./provider";
import { getDefaultSessionStore, type SessionStore } from "./session-store";

export interface AnswerSuggestionSet {
  readonly suggestions: AnswerSuggestion[];
  readonly source: "local" | "deepseek";
}

const hasRefinement = (refinement: LanguageRefinement): boolean =>
  refinement.topic !== undefined ||
  refinement.marker !== undefined ||
  refinement.question !== undefined;

const isOneQuestion = (value: string): boolean => {
  const marks = value.match(/[？?]/gu);
  return marks === null || marks.length <= 1;
};

function replaceLastMirrorQuestion(
  messages: readonly MirrorMessage[],
  question: string,
): MirrorMessage[] {
  const lastMirrorIndex = messages.findLastIndex((message) => message.role === "mirror");
  if (lastMirrorIndex < 0) {
    return [...messages];
  }

  return messages.map((message, index) =>
    index === lastMirrorIndex ? { ...message, content: question } : message,
  );
}

function applyRefinement(
  session: MirrorSession,
  refinement: LanguageRefinement | null,
): MirrorSession {
  if (refinement === null || !hasRefinement(refinement)) {
    return session;
  }

  const safeQuestion =
    refinement.question !== undefined &&
    isOneQuestion(refinement.question) &&
    isDimensionAligned(refinement.question, "field")
      ? refinement.question
      : undefined;

  return {
    ...session,
    ...(refinement.topic === undefined ? {} : { topic: refinement.topic }),
    ...(refinement.marker === undefined ? {} : { marker: refinement.marker }),
    messages:
      safeQuestion === undefined
        ? session.messages
        : replaceLastMirrorQuestion(session.messages, safeQuestion),
    provider: "deepseek",
  };
}

function isDimensionAligned(question: string, dimension: Dimension): boolean {
  switch (dimension) {
    case "field":
      return /条件|资源|制度|规则|权力|成本|选择之前|共同观念/u.test(question);
    case "ontology":
      return /真实|存在|事实|现实/u.test(question) && /承认|相信|理解|物质|社会/u.test(question);
    case "phenomenology":
      return (
        /证据|线索|判断/u.test(question) && /修正|确信|进入|先看|直觉|数据|个案/u.test(question)
      );
    case "teleology":
      return (
        /改变|变量|干预|先改|更换/u.test(question) &&
        /机制|结果|观念|资源|规则|激励/u.test(question)
      );
  }
}

function assertUnchanged(expected: MirrorSession, current: MirrorSession): void {
  if (current.updatedAt !== expected.updatedAt) {
    throw new DomainError("会话刚刚在另一个请求中更新，请重试。", "CONFLICT", 409);
  }
}

function validateGeneratedSuggestions(value: unknown): AnswerSuggestion[] | null {
  const parsed = AnswerSuggestionSchema.array().length(4).safeParse(value);
  if (!parsed.success) {
    return null;
  }
  const uniqueLenses = new Set(parsed.data.map((suggestion) => suggestion.lens));
  const uniqueContent = new Set(parsed.data.map((suggestion) => suggestion.content));
  const combined = parsed.data.map((suggestion) => suggestion.content).join("\n");
  if (
    uniqueLenses.size !== 4 ||
    uniqueContent.size !== parsed.data.length ||
    /唯心|唯物|主义者/u.test(combined) ||
    !assessSafety(combined).safe
  ) {
    return null;
  }
  return parsed.data;
}

export class MirrorSessionService {
  public constructor(
    private readonly store: SessionStore,
    private readonly provider: MirrorLanguageProvider | null = null,
  ) {}

  public async create(input: string): Promise<MirrorSession> {
    let session = createLocalSession(input);
    if (this.provider !== null && session.stage !== "safety_stop") {
      const question = session.messages.findLast((message) => message.role === "mirror");
      if (question !== undefined) {
        const refinement = await this.provider.refineIntake({
          intake: session.intake,
          localTopic: session.topic,
          localMarker: session.marker,
          localQuestion: question.content,
        });
        session = applyRefinement(session, refinement);
      }
    }
    return this.store.insert(session);
  }

  public async get(id: string): Promise<MirrorSession> {
    const session = await this.store.findById(id);
    if (session === null) {
      throw new DomainError("没有找到这次探索。", "NOT_FOUND", 404);
    }
    // Old persisted sessions have no `suggestions` field. Hydrate their current
    // question at the response boundary without rewriting or invalidating them.
    return ensureLocalAnswerSuggestions(session);
  }

  public confirmTopic(id: string, topic: string): Promise<MirrorSession> {
    return this.store.update(id, (session) => confirmSessionTopic(session, topic));
  }

  public async answer(id: string, answer: string): Promise<MirrorSession> {
    const current = await this.get(id);
    const next = advanceLocalSession(current, answer);

    return this.store.update(id, (latest) => {
      assertUnchanged(current, latest);
      return next;
    });
  }

  public async suggestions(id: string): Promise<AnswerSuggestionSet> {
    const session = ensureLocalAnswerSuggestions(await this.get(id));
    if (
      (session.stage !== "topic_confirm" && session.stage !== "questioning") ||
      session.questionIndex >= session.totalQuestions
    ) {
      throw new DomainError("当前没有等待回答的问题。", "INVALID_STAGE", 409);
    }

    const localSuggestions = session.suggestions;
    const question = session.messages.findLast(
      (message) => message.role === "mirror" && message.dimension !== undefined,
    );
    if (
      this.provider?.suggestAnswers === undefined ||
      question === undefined ||
      question.dimension === undefined
    ) {
      return { suggestions: localSuggestions, source: "local" };
    }

    const generated = await this.provider.suggestAnswers({
      topic: session.topic,
      marker: session.marker,
      dimension: question.dimension,
      question: question.content,
      messages: session.messages,
      localSuggestions,
    });
    const validated = validateGeneratedSuggestions(generated);
    return validated === null
      ? { suggestions: localSuggestions, source: "local" }
      : { suggestions: validated, source: "deepseek" };
  }

  public async getResult(id: string): Promise<SessionResult> {
    const session = await this.get(id);
    if (session.result === undefined) {
      throw new DomainError("这次探索还没有生成结果。", "INVALID_STAGE", 409);
    }
    return session.result;
  }

  public updateStance(
    id: string,
    hypothesisId: string,
    stance: Exclude<HypothesisStance, "unreviewed">,
    note: string | undefined,
  ): Promise<MirrorSession> {
    return this.store.update(id, (session) =>
      updateHypothesisStance(session, hypothesisId, stance, note),
    );
  }

  public async experiment(
    id: string,
    dimension: Dimension,
  ): Promise<{
    readonly experiment: CounterfactualExperiment;
    readonly session: MirrorSession;
  }> {
    const current = await this.get(id);
    const created = createCounterfactualExperiment(current, dimension);
    const session = await this.store.update(id, (latest) => {
      assertUnchanged(current, latest);
      return created.session;
    });
    return { experiment: created.experiment, session };
  }

  public submitFeedback(
    id: string,
    input: Omit<SessionFeedback, "submittedAt">,
  ): Promise<MirrorSession> {
    return this.store.update(id, (session) => {
      if (session.result === undefined) {
        throw new DomainError("结果生成后才能提交反馈。", "INVALID_STAGE", 409);
      }
      const submittedAt = new Date().toISOString();
      return {
        ...session,
        stage: "feedback",
        feedback: { ...input, submittedAt },
        updatedAt: submittedAt,
      };
    });
  }

  public async delete(id: string): Promise<void> {
    const deleted = await this.store.delete(id);
    if (!deleted) {
      throw new DomainError("没有找到这次探索。", "NOT_FOUND", 404);
    }
  }
}

let defaultService: MirrorSessionService | undefined;

export function getMirrorSessionService(): MirrorSessionService {
  defaultService ??= new MirrorSessionService(
    getDefaultSessionStore(),
    createLanguageProviderFromEnv(),
  );
  return defaultService;
}
