import {
  advanceLocalSession,
  confirmSessionTopic,
  createCounterfactualExperiment,
  createLocalSession,
  updateHypothesisStance,
} from "../domain/engine";
import { DomainError } from "../domain/errors";
import type {
  CounterfactualExperiment,
  Dimension,
  HypothesisStance,
  MirrorMessage,
  MirrorSession,
  SessionFeedback,
  SessionResult,
} from "../domain/schemas";
import {
  createLanguageProviderFromEnv,
  type LanguageRefinement,
  type MirrorLanguageProvider,
} from "./provider";
import { getDefaultSessionStore, type SessionStore } from "./session-store";

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
    refinement.question !== undefined && isOneQuestion(refinement.question)
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

function assertUnchanged(expected: MirrorSession, current: MirrorSession): void {
  if (current.updatedAt !== expected.updatedAt) {
    throw new DomainError("会话刚刚在另一个请求中更新，请重试。", "CONFLICT", 409);
  }
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
    return session;
  }

  public confirmTopic(id: string, topic: string): Promise<MirrorSession> {
    return this.store.update(id, (session) => confirmSessionTopic(session, topic));
  }

  public async answer(id: string, answer: string): Promise<MirrorSession> {
    const current = await this.get(id);
    let next = advanceLocalSession(current, answer);

    if (this.provider !== null && next.stage === "questioning") {
      const question = next.messages.findLast((message) => message.role === "mirror");
      if (question?.dimension !== undefined) {
        const refinement = await this.provider.refineQuestion({
          topic: next.topic,
          marker: next.marker,
          dimension: question.dimension,
          localQuestion: question.content,
          messages: next.messages,
        });
        next = applyRefinement(next, refinement);
      }
    }

    return this.store.update(id, (latest) => {
      assertUnchanged(current, latest);
      return next;
    });
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
