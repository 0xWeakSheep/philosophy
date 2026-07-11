import { z } from "zod";

export const DimensionSchema = z.enum(["field", "ontology", "phenomenology", "teleology"]);

export const SessionStageSchema = z.enum([
  "intake",
  "topic_confirm",
  "questioning",
  "recap",
  "result",
  "feedback",
  "safety_stop",
]);

export const RiskFlagSchema = z.enum(["self_harm", "harm_to_others", "immediate_danger"]);

export const MessageRoleSchema = z.enum(["user", "mirror"]);

export const ConfidenceSchema = z.enum(["low", "medium", "high"]);

export const DimensionSignalSchema = z.enum(["order", "conflict", "center", "open"]);

export const HypothesisStanceSchema = z.enum([
  "unreviewed",
  "resonates",
  "partial",
  "situational",
  "rejects",
  "counterexample",
]);

export const MirrorMessageSchema = z.object({
  id: z.string().min(1),
  role: MessageRoleSchema,
  content: z.string().min(1),
  dimension: DimensionSchema.optional(),
  createdAt: z.string().datetime(),
});

export const EvidenceNodeSchema = z.object({
  id: z.string().min(1),
  quote: z.string().min(1),
  sourceMessageId: z.string().min(1),
  note: z.string().min(1),
});

export const HypothesisSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  interpretation: z.string().min(1),
  evidence: z.array(EvidenceNodeSchema).min(1),
  counterEvidence: z.array(EvidenceNodeSchema),
  stance: HypothesisStanceSchema,
  stanceNote: z.string().max(600).optional(),
});

export const DimensionReadingSchema = z.object({
  dimension: DimensionSchema,
  label: z.string().min(1),
  signal: DimensionSignalSchema,
  observation: z.string().min(1),
  confidence: ConfidenceSchema,
});

export const MirrorWindowSchema = z.object({
  externalFactors: z.array(z.string().min(1)).min(1),
  question: z.string().min(1),
  note: z.string().min(1),
});

export const SessionResultSchema = z.object({
  coreTension: z.string().min(1),
  hypotheses: z.array(HypothesisSchema).min(2).max(4),
  dimensions: z.array(DimensionReadingSchema).min(2).max(4),
  uncertainties: z.array(z.string().min(1)).min(1),
  nextQuestion: z.string().min(1),
  window: MirrorWindowSchema,
  durationSeconds: z.number().int().nonnegative(),
  generatedAt: z.string().datetime(),
});

export const CounterfactualExperimentSchema = z.object({
  id: z.string().min(1),
  changedDimension: DimensionSchema,
  title: z.string().min(1),
  before: z.string().min(1),
  after: z.string().min(1),
  prompt: z.string().min(1),
  observation: z.string().min(1),
  createdAt: z.string().datetime(),
});

export const SessionFeedbackSchema = z.object({
  structureDiscovery: z.boolean(),
  feltLabeled: z.boolean(),
  rating: z.number().int().min(1).max(5).optional(),
  note: z.string().trim().max(1000).optional(),
  submittedAt: z.string().datetime(),
});

export const MirrorSessionSchema = z.object({
  id: z.string().uuid(),
  stage: SessionStageSchema,
  topic: z.string().min(1).max(180),
  intake: z.string().min(1).max(4000),
  marker: z.string().min(1).max(80),
  questionIndex: z.number().int().min(0).max(5),
  totalQuestions: z.number().int().min(3).max(5),
  messages: z.array(MirrorMessageSchema),
  result: SessionResultSchema.optional(),
  riskFlags: z.array(RiskFlagSchema),
  safetyMessage: z.string().min(1).optional(),
  experiments: z.array(CounterfactualExperimentSchema),
  feedback: SessionFeedbackSchema.optional(),
  provider: z.enum(["local", "deepseek"]),
  promptVersion: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateSessionInputSchema = z
  .object({
    input: z.string().trim().min(8).max(4000).optional(),
    intake: z.string().trim().min(8).max(4000).optional(),
  })
  .refine((value) => value.input !== undefined || value.intake !== undefined, {
    message: "请写下一件具体发生过的事。",
  })
  .transform((value) => ({ input: value.input ?? value.intake ?? "" }));

export const ConfirmTopicInputSchema = z.object({
  topic: z.string().trim().min(4).max(180),
});

export const AnswerInputSchema = z
  .object({
    message: z.string().trim().min(1).max(3000).optional(),
    content: z.string().trim().min(1).max(3000).optional(),
  })
  .refine((value) => value.message !== undefined || value.content !== undefined, {
    message: "请写下你对这个问题的回答。",
  })
  .transform((value) => ({ message: value.message ?? value.content ?? "" }));

export const UpdateStanceInputSchema = z.object({
  hypothesisId: z.string().min(1),
  stance: HypothesisStanceSchema.exclude(["unreviewed"]),
  note: z.string().trim().max(600).optional(),
});

export const CreateExperimentInputSchema = z.object({
  dimension: DimensionSchema,
});

export const SubmitFeedbackInputSchema = z.object({
  structureDiscovery: z.boolean(),
  feltLabeled: z.boolean(),
  rating: z.number().int().min(1).max(5).optional(),
  note: z.string().trim().max(1000).optional(),
});

export const SessionDatabaseSchema = z.object({
  version: z.literal(1),
  sessions: z.record(z.string(), MirrorSessionSchema),
});

export type Dimension = z.infer<typeof DimensionSchema>;
export type SessionStage = z.infer<typeof SessionStageSchema>;
export type RiskFlag = z.infer<typeof RiskFlagSchema>;
export type MirrorMessage = z.infer<typeof MirrorMessageSchema>;
export type EvidenceNode = z.infer<typeof EvidenceNodeSchema>;
export type Hypothesis = z.infer<typeof HypothesisSchema>;
export type HypothesisStance = z.infer<typeof HypothesisStanceSchema>;
export type DimensionReading = z.infer<typeof DimensionReadingSchema>;
export type SessionResult = z.infer<typeof SessionResultSchema>;
export type CounterfactualExperiment = z.infer<typeof CounterfactualExperimentSchema>;
export type SessionFeedback = z.infer<typeof SessionFeedbackSchema>;
export type MirrorSession = z.infer<typeof MirrorSessionSchema>;
export type SessionDatabase = z.infer<typeof SessionDatabaseSchema>;
export type CreateSessionInput = z.infer<typeof CreateSessionInputSchema>;
export type ConfirmTopicInput = z.infer<typeof ConfirmTopicInputSchema>;
export type AnswerInput = z.infer<typeof AnswerInputSchema>;
export type UpdateStanceInput = z.infer<typeof UpdateStanceInputSchema>;
export type CreateExperimentInput = z.infer<typeof CreateExperimentInputSchema>;
export type SubmitFeedbackInput = z.infer<typeof SubmitFeedbackInputSchema>;
