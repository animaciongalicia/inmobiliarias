import { WizardData } from "./types";

type ValidationSuccess = { valid: true; data: WizardData };
type ValidationFailure = { valid: false; error: string };
type ValidationResult = ValidationSuccess | ValidationFailure;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSubmitBody(body: unknown): ValidationResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { valid: false, error: "Invalid request body." };
  }

  const d = body as Record<string, unknown>;

  // Required string fields
  const stringFields: Array<keyof WizardData> = [
    "profile",
    "zone",
    "propertyType",
    "purchaseRange",
    "intent",
    "analysisCommitment",
    "name",
    "email",
    "phone",
  ];

  for (const field of stringFields) {
    if (
      d[field] === undefined ||
      d[field] === null ||
      String(d[field]).trim() === ""
    ) {
      return { valid: false, error: `El campo "${field}" es obligatorio.` };
    }
  }

  // Email format
  if (!EMAIL_REGEX.test(String(d.email).trim())) {
    return { valid: false, error: "El email no tiene un formato válido." };
  }

  // Satisfaction: number 1–5
  const sat = Number(d.satisfaction);
  if (!Number.isFinite(sat) || sat < 1 || sat > 5) {
    return {
      valid: false,
      error: "La satisfacción debe ser un número entre 1 y 5.",
    };
  }

  // Consent: must be true
  if (!d.consent) {
    return {
      valid: false,
      error: "Es necesario aceptar el consentimiento para continuar.",
    };
  }

  return {
    valid: true,
    data: {
      profile: String(d.profile).trim(),
      zone: String(d.zone).trim(),
      propertyType: String(d.propertyType).trim(),
      purchaseRange: String(d.purchaseRange).trim(),
      satisfaction: sat,
      intent: String(d.intent).trim(),
      analysisCommitment: String(d.analysisCommitment).trim(),
      name: String(d.name).trim(),
      email: String(d.email).trim().toLowerCase(),
      phone: String(d.phone).trim(),
      consent: true,
    },
  };
}
