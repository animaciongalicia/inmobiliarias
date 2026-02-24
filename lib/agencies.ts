import { AgencyConfig } from "./types";

export const agencies: Record<string, AgencyConfig> = {
  DEFAULT: {
    agency_id: "default",
    agency_name: "Radar Propietario – A Coruña",
    brand_color: "#1d4ed8",
    webhook_env_key: "MAKE_WEBHOOK_DEFAULT",
    // whatsapp: "+34600000000", // ← descomenta y pon el número real
  },
  coruna01: {
    agency_id: "coruna01",
    agency_name: "Inmobiliaria Coruña 01",
    brand_color: "#0f766e",
    webhook_env_key: "MAKE_WEBHOOK_CORUNA01",
    // whatsapp: "+34600000001", // ← descomenta y pon el número real
  },
};

/**
 * Returns the agency config for the given agency param.
 * Falls back to DEFAULT if the param is missing or unknown.
 */
export function getAgencyConfig(agencyParam?: string | null): AgencyConfig {
  if (!agencyParam) return agencies.DEFAULT;
  return agencies[agencyParam] ?? agencies.DEFAULT;
}

/**
 * Returns the webhook URL for the given agency config.
 * Reads from process.env on the server. Never call this client-side.
 * Falls back to MAKE_WEBHOOK_DEFAULT if the agency-specific env is missing.
 */
export function getWebhookUrl(config: AgencyConfig): string {
  const specificUrl = process.env[config.webhook_env_key];
  if (specificUrl) return specificUrl;
  return process.env.MAKE_WEBHOOK_DEFAULT ?? "";
}
