import { z } from "zod";
import { assessSafety } from "../domain/safety";
import type { Dimension, MirrorMessage } from "../domain/schemas";

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

export interface LanguageRefinement {
  readonly topic?: string;
  readonly marker?: string;
  readonly question?: string;
}

export interface MirrorLanguageProvider {
  readonly name: "deepseek";
  refineIntake(request: IntakeRefinementRequest): Promise<LanguageRefinement | null>;
  refineQuestion(request: QuestionRefinementRequest): Promise<LanguageRefinement | null>;
}

const RefinementSchema = z.object({
  topic: z.string().trim().min(4).max(180).optional(),
  marker: z.string().trim().min(1).max(80).optional(),
  question: z.string().trim().min(4).max(500).optional(),
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
}

const SYSTEM_PROMPT = [
  "你是意识形态镜室的语言编辑，不是心理治疗师。",
  "你只改写给定草稿，不诊断，不给治疗承诺，不使用人格或政治标签。",
  "每次只给一个问题。问题必须引用用户表达中的具体词，保持可反驳和非评判。",
  '输出 JSON，格式示例：{"topic":"本次议题","marker":"原话片段","question":"唯一的问题？"}。字段只允许 topic、marker、question，无需改写的字段可以省略。',
  "不要使用长破折号。",
].join("\n");

const sanitizeVisibleText = (text: string): string =>
  text.replace(/[—–]/gu, "，").replace(/\s+/gu, " ").trim();

function stripJsonFence(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith("```")) {
    return trimmed;
  }
  return trimmed.replace(/^```(?:json)?\s*/iu, "").replace(/\s*```$/u, "");
}

export class DeepSeekLanguageProvider implements MirrorLanguageProvider {
  public readonly name = "deepseek" as const;

  private readonly timeoutMs: number;

  public constructor(private readonly options: DeepSeekProviderOptions) {
    this.timeoutMs = options.timeoutMs ?? 8_000;
  }

  private async request(payload: string): Promise<LanguageRefinement | null> {
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
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: payload },
          ],
          response_format: { type: "json_object" },
          temperature: 0.35,
          max_tokens: 500,
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!response.ok) {
        return null;
      }

      const envelope = DeepSeekEnvelopeSchema.safeParse(await response.json());
      if (!envelope.success) {
        return null;
      }

      const firstChoice = envelope.data.choices[0];
      if (firstChoice === undefined) {
        return null;
      }

      const parsed = RefinementSchema.safeParse(
        JSON.parse(stripJsonFence(firstChoice.message.content)) as unknown,
      );
      if (!parsed.success) {
        return null;
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
      return assessSafety(combined).safe ? refinement : null;
    } catch {
      return null;
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
