import type { RiskFlag } from "./schemas";

export interface SafetyAssessment {
  readonly safe: boolean;
  readonly riskFlags: readonly RiskFlag[];
  readonly message?: string;
}

const SELF_HARM_PATTERNS = [
  /自杀/u,
  /不想活(?:了|下去)?/u,
  /结束(?:我|自己)的生命/u,
  /杀(?:了|掉)?自己/u,
  /伤害自己/u,
  /自残/u,
  /割腕/u,
  /跳楼/u,
  /吞药/u,
  /suicid(?:e|al)/iu,
  /kill myself/iu,
] as const;

const HARM_TO_OTHERS_PATTERNS = [
  /杀(?:了|掉|死)?(?:他|她|他们|她们|那个人|对方)/u,
  /弄死(?:他|她|他们|她们|那个人|对方)/u,
  /伤害(?:他|她|他们|她们|别人|对方)/u,
  /报复.{0,8}(?:杀|伤害|弄死)/u,
  /kill (?:him|her|them)/iu,
] as const;

const IMMEDIATE_DANGER_PATTERNS = [
  /(?:现在|马上|今晚|立刻).{0,12}(?:自杀|自残|跳楼|杀|伤害|弄死)/u,
  /(?:刀|枪|药|绳|汽油).{0,12}(?:准备好|在手边|已经买|拿着)/u,
  /(?:已经|正在).{0,8}(?:割腕|吞药|跳楼|伤害|动手)/u,
] as const;

const hasMatch = (text: string, patterns: readonly RegExp[]): boolean =>
  patterns.some((pattern) => pattern.test(text));

export const SAFETY_STOP_MESSAGE =
  "我先暂停这次探索。你描述的内容可能涉及你或他人的即时安全。请先联系一位此刻能陪在你身边的可信任的人。如果危险正在发生，请立即联系当地急救或报警服务。在中国大陆可拨打 120 或 110。你不需要独自处理这一刻。";

export function assessSafety(text: string): SafetyAssessment {
  const normalized = text.normalize("NFKC").trim();
  const flags: RiskFlag[] = [];

  if (hasMatch(normalized, SELF_HARM_PATTERNS)) {
    flags.push("self_harm");
  }

  if (hasMatch(normalized, HARM_TO_OTHERS_PATTERNS)) {
    flags.push("harm_to_others");
  }

  if (hasMatch(normalized, IMMEDIATE_DANGER_PATTERNS)) {
    flags.push("immediate_danger");
  }

  if (flags.length === 0) {
    return { safe: true, riskFlags: [] };
  }

  return {
    safe: false,
    riskFlags: flags,
    message: SAFETY_STOP_MESSAGE,
  };
}
