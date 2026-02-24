export type WizardData = {
  profile: string;
  zone: string;
  propertyType: string;
  purchaseRange: string;
  satisfaction: number;
  intent: string;
  analysisCommitment: string;
  name: string;
  email: string;
  phone: string;
  consent: boolean;
};

export type Category = "A" | "B" | "C";

export type ScoreResult = {
  score: number;
  category: Category;
};

export type SubmitPayload = WizardData & {
  agency_id: string;
  agency_name: string;
  score: number;
  category: Category;
  submitted_at: string;
};

export type AgencyConfig = {
  agency_id: string;
  agency_name: string;
  brand_color: string;
  webhook_env_key: string;
};

export type ZoneInfo = {
  tendencia: string;
  oportunidad: string;
  alerta: string;
};

export type ApiSubmitResponse =
  | { ok: true; score: number; category: Category; resultCopy: string; delivered: boolean }
  | { ok: false; error: string };
