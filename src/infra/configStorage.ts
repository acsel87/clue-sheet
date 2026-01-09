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

    // Handle backwards compatibility
    if (typeof parsedUnknown === "object" && parsedUnknown !== null) {
      const obj = parsedUnknown as Record<string, unknown>;

      // Add autoRules if missing (from older versions)
      if (!("autoRules" in obj)) {
        obj.autoRules = DEFAULT_AUTO_RULES;
      }

      // Remove deprecated fields (handSize, publicCount)
      // These are now derived at runtime
      delete obj.handSize;
      delete obj.publicCount;
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

  // Basic integrity check
  const verify = localStorage.getItem(KEY);
  if (verify !== json) {
    throw new Error("localStorage write verification failed");
  }

  return parsed;
}
