// src/infra/configStorage.ts

import {
  AppConfigSchema,
  DEFAULT_CONFIG,
  DEFAULT_AUTO_RULES,
  type AppConfig,
} from "../domain";

const KEY = "clue_sheet_config_v1";

export function loadConfig(): AppConfig {
  const raw = localStorage.getItem(KEY);
  if (!raw) return DEFAULT_CONFIG;

  try {
    const parsedUnknown: unknown = JSON.parse(raw);

    // Handle backwards compatibility: add autoRules if missing
    if (
      typeof parsedUnknown === "object" &&
      parsedUnknown !== null &&
      !("autoRules" in parsedUnknown)
    ) {
      (parsedUnknown as Record<string, unknown>).autoRules = DEFAULT_AUTO_RULES;
    }

    return AppConfigSchema.parse(parsedUnknown);
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(nextUnknown: unknown): AppConfig {
  const parsed = AppConfigSchema.parse(nextUnknown);
  const json = JSON.stringify(parsed);
  localStorage.setItem(KEY, json);

  // basic integrity check (optional but aligns with your transactional posture)
  const verify = localStorage.getItem(KEY);
  if (verify !== json) {
    throw new Error("localStorage write verification failed");
  }

  return parsed;
}
