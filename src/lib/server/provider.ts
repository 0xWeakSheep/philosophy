import { randomUUID } from "node:crypto";

import { z } from "zod";
import { assessSafety } from "../domain/safety";
import type { AnswerSuggestion, Dimension, MirrorMessage } from "../domain/schemas";

export interface IntakeRefinementRequest {
  readonly intake: string;
  readonly localTopic: string;
  readonly localMarker: string;
  readonly localQuestion: string;
}

export interface QuestionRefinementRequest {
  readonly topic: string;
  readonly marker: string;
  readonly dimension: Dimension;
  readonly localQuestion: string;
  readonly messages: readonly MirrorMessage[];
}

export interface AnswerSuggestionRequest {
  readonly topic: string;
  readonly marker: string;
  readonly dimension: Dimension;
  readonly question: string;
  readonly messages: readonly MirrorMessage[];
  readonly localSuggestions: readonly AnswerSuggestion[];
}

export interface LanguageRefinement {
  readonly topic?: string;
  readonly marker?: string;
  readonly question?: string;
}

export interface MirrorLanguageProvider {
  readonly name: "deepseek";
  refineIntake(request: IntakeRefinementRequest): Promise<LanguageRefinement | null>;
  refineQuestion(request: QuestionRefinementRequest): Promise<LanguageRefinement | null>;
  suggestAnswers?(request: AnswerSuggestionRequest): Promise<AnswerSuggestion[] | null>;
}

const RefinementSchema = z.object({
  topic: z.string().trim().min(4).max(180).optional(),
  marker: z.string().trim().min(1).max(80).optional(),
  question: z.string().trim().min(4).max(500).optional(),
});

const SuggestedAnswerDraftSchema = z.object({
  lens: z.enum(["agency", "conditions", "integrated", "uncertain"]),
  content: z.string().trim().min(4).max(140),
});

const AnswerSuggestionsResponseSchema = z.object({
  suggestions: z.array(SuggestedAnswerDraftSchema).length(4),
});

const DeepSeekEnvelopeSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({ content: z.string() }),
      }),
    )
    .min(1),
});

interface DeepSeekProviderOptions {
  readonly apiKey: string;
  readonly baseUrl: string;
  readonly model: string;
  readonly timeoutMs?: number;
  readonly suggestionTimeoutMs?: number;
}

const SYSTEM_PROMPT = [
  "你是意识形态镜室的语言编辑，不是哲学判官或心理治疗师。",
  "你只改写给定草稿，不诊断，不推断政治立场、道德水平或固定人格。",
  "不得直接宣判用户是唯心主义者或唯物主义者，只能描述本次议题中观念、选择与条件、结构的优先顺序。",
  "分开本体判断、因果判断、责任判断与干预判断。强调责任不自动等于唯心，强调条件不自动等于唯物。",
  "每次只给一个问题。问题必须引用用户表达中的具体词，要求作用机制，并允许竞争解释与反例。",
  "改写后必须保留 localDraft 的哲学任务和 dimension，不得跨到另一面镜子，也不得在追问阶段改写 topic 或 marker。",
  '输出 JSON，格式示例：{"topic":"本次议题","marker":"原话片段","question":"唯一的问题？"}。字段只允许 topic、marker、question，无需改写的字段可以省略。',
  "不要使用长破折号。",
].join("\n");

const SUGGESTION_SYSTEM_PROMPT = [
  "你为意识形态镜室生成可编辑的候选回答，不是替用户下结论。",
  "只针对当前问题给出四个第一人称回答，每个回答是一句话、28 到 90 个中文字符、具体、自然、可以直接提交。",
  "使用朋友之间会说的日常中文，避免因果链条、实证研究、主体性等学术腔；只有用户自己使用时才保留专业词。",
  "四个回答必须分别使用 agency、conditions、integrated、uncertain 四种 lens，且每种只出现一次。",
  "agency 从理解、意愿、选择或共同观念切入；conditions 从资源、身体、制度、技术或权力切入。",
  "integrated 要写清两层如何相互作用；uncertain 要诚实说出还缺哪项证据或机制。",
  "不得使用唯心、唯物、主义者等标签，不得诊断人格、政治立场或道德水平，不得假定用户已经同意任何答案。",
  "候选之间不能只是同义改写，也不要复述完整问题。保留用户原话中的具体语境，但不要捏造事实。",
  '只输出 JSON：{"suggestions":[{"lens":"agency","content":"我……"},{"lens":"conditions","content":"我……"},{"lens":"integrated","content":"我……"},{"lens":"uncertain","content":"我……"}]}。',
  "不要使用长破折号。",
].join("\n");

const sanitizeVisibleText = (text: string): string =>
  text
    .replace(/[—–]/gu, "，")
    .replace(/[，,]{2,}/gu, "，")
    .replace(/[。.]{2,}/gu, "。")
    .replace(/\s+/gu, " ")
    .trim();

function stripJsonFence(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith("```")) {
    return trimmed;
  }
  return trimmed.replace(/^```(?:json)?\s*/iu, "").replace(/\s*```$/u, "");
}

export class DeepSeekLanguageProvider implements MirrorLanguageProvider {
  public readonly name = "deepseek" as const;

  private cooldownUntil = 0;

  private readonly timeoutMs: number;

  private readonly suggestionTimeoutMs: number;

  public constructor(private readonly options: DeepSeekProviderOptions) {
    this.timeoutMs = options.timeoutMs ?? 3_500;
    this.suggestionTimeoutMs =
      options.suggestionTimeoutMs ?? (options.timeoutMs === undefined ? 8_000 : this.timeoutMs);
  }

  private fail(): null {
    this.cooldownUntil = Date.now() + 60_000;
    return null;
  }

  private async requestJson(
    payload: string,
    systemPrompt: string,
    temperature: number,
    maxTokens: number,
    timeoutMs = this.timeoutMs,
  ): Promise<unknown | null> {
    if (Date.now() < this.cooldownUntil) {
      return null;
    }

    try {
      const endpoint = `${this.options.baseUrl.replace(/\/$/u, "")}/chat/completions`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.options.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: payload },
          ],
          thinking: { type: "disabled" },
          response_format: { type: "json_object" },
          temperature,
          max_tokens: maxTokens,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        return this.fail();
      }

      const envelope = DeepSeekEnvelopeSchema.safeParse(await response.json());
      if (!envelope.success) {
        return this.fail();
      }

      const firstChoice = envelope.data.choices[0];
      if (firstChoice === undefined) {
        return this.fail();
      }

      return JSON.parse(stripJsonFence(firstChoice.message.content)) as unknown;
    } catch {
      return this.fail();
    }
  }

  private async request(payload: string): Promise<LanguageRefinement | null> {
    const raw = await this.requestJson(payload, SYSTEM_PROMPT, 0.35, 500);
    if (raw === null) {
      return null;
    }

    try {
      const parsed = RefinementSchema.safeParse(raw);
      if (!parsed.success) {
        return this.fail();
      }

      const refinement: LanguageRefinement = {
        ...(parsed.data.topic === undefined
          ? {}
          : { topic: sanitizeVisibleText(parsed.data.topic) }),
        ...(parsed.data.marker === undefined
          ? {}
          : { marker: sanitizeVisibleText(parsed.data.marker) }),
        ...(parsed.data.question === undefined
          ? {}
          : { question: sanitizeVisibleText(parsed.data.question) }),
      };
      const combined = Object.values(refinement).join("\n");
      if (!assessSafety(combined).safe) {
        return this.fail();
      }
      this.cooldownUntil = 0;
      return refinement;
    } catch {
      return this.fail();
    }
  }

  public refineIntake(request: IntakeRefinementRequest): Promise<LanguageRefinement | null> {
    return this.request(
      JSON.stringify({
        task: "refine_intake",
        intake: request.intake,
        localDraft: {
          topic: request.localTopic,
          marker: request.localMarker,
          question: request.localQuestion,
        },
      }),
    );
  }

  public refineQuestion(request: QuestionRefinementRequest): Promise<LanguageRefinement | null> {
    return this.request(
      JSON.stringify({
        task: "refine_one_question",
        topic: request.topic,
        marker: request.marker,
        dimension: request.dimension,
        recentMessages: request.messages.slice(-5).map((message) => ({
          role: message.role,
          content: message.content,
        })),
        localDraft: { question: request.localQuestion },
      }),
    );
  }

  public async suggestAnswers(
    request: AnswerSuggestionRequest,
  ): Promise<AnswerSuggestion[] | null> {
    const raw = await this.requestJson(
      JSON.stringify({
        task: "suggest_editable_answers",
        topic: request.topic,
        marker: request.marker,
        dimension: request.dimension,
        question: request.question,
        recentMessages: request.messages.slice(-6).map((message) => ({
          role: message.role,
          content: message.content,
        })),
        localExamples: request.localSuggestions.map((suggestion) => ({
          lens: suggestion.lens,
          content: suggestion.content,
        })),
      }),
      SUGGESTION_SYSTEM_PROMPT,
      0.72,
      600,
      this.suggestionTimeoutMs,
    );
    if (raw === null) {
      return null;
    }

    const parsed = AnswerSuggestionsResponseSchema.safeParse(raw);
    if (!parsed.success) {
      return this.fail();
    }

    const suggestions = parsed.data.suggestions.map((suggestion) => ({
      id: `ai-${randomUUID()}`,
      lens: suggestion.lens,
      content: sanitizeVisibleText(suggestion.content),
    }));
    const uniqueLenses = new Set(suggestions.map((suggestion) => suggestion.lens));
    const uniqueContent = new Set(suggestions.map((suggestion) => suggestion.content));
    const combined = suggestions.map((suggestion) => suggestion.content).join("\n");
    if (
      uniqueLenses.size !== 4 ||
      uniqueContent.size !== suggestions.length ||
      suggestions.some((suggestion) => !/我/u.test(suggestion.content)) ||
      /唯心|唯物|主义者/u.test(combined) ||
      !assessSafety(combined).safe
    ) {
      return this.fail();
    }

    this.cooldownUntil = 0;
    return suggestions;
  }
}

export function createLanguageProviderFromEnv(): MirrorLanguageProvider | null {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (apiKey === undefined || apiKey.length === 0) {
    return null;
  }

  return new DeepSeekLanguageProvider({
    apiKey,
    baseUrl: process.env.DEEPSEEK_BASE_URL?.trim() || "https://api.deepseek.com",
    model: process.env.DEEPSEEK_MODEL?.trim() || "deepseek-v4-flash",
  });
}
