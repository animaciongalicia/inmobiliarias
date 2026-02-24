"use client";

import { useState, useEffect, useCallback } from "react";
import { ProgressBar } from "./ProgressBar";
import { StepHeader } from "./StepHeader";
import { QuestionCard } from "./QuestionCard";
import { Button } from "./Button";
import { Input } from "./Input";
import { getAgencyConfig } from "@/lib/agencies";
import { ZONE_NAMES } from "@/lib/zones";
import { WizardData, Category, ApiSubmitResponse } from "@/lib/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_QUESTION_STEPS = 8; // steps 2–9
const STORAGE_KEY = "radar_wizard_v1";

const PROFILE_OPTIONS = [
  "Vivo en la vivienda",
  "La tengo alquilada",
  "Es una herencia",
  "Está vacía",
  "Estoy pensando en cambiar de casa",
  "No lo había pensado hasta ahora",
];

const PROPERTY_TYPE_OPTIONS = [
  "Piso",
  "Ático",
  "Dúplex",
  "Casa",
  "Chalet/Independiente",
  "Otro",
];

const PURCHASE_RANGE_OPTIONS = [
  "Menos de 5 años",
  "5–10 años",
  "10–20 años",
  "Más de 20 años",
  "Herencia",
];

const INTENT_OPTIONS = [
  "0–6 meses",
  "6–12 meses",
  "12–24 meses",
  "Más adelante",
  "No lo sé",
];

const ANALYSIS_OPTIONS = [
  "Sí, análisis personalizado",
  "Solo por curiosidad",
];

// ─── Types ────────────────────────────────────────────────────────────────────

type FieldErrors = Partial<Record<keyof WizardData | "form", string>>;

interface ResultData {
  score: number;
  category: Category;
  resultCopy: string;
  delivered: boolean;
}

// ─── Result screen ────────────────────────────────────────────────────────────

function ResultScreen({
  result,
  agencyName,
  brandColor,
  onReset,
}: {
  result: ResultData;
  agencyName: string;
  brandColor: string;
  onReset: () => void;
}) {
  const badges: Record<Category, { label: string; bg: string; text: string }> =
    {
      A: {
        label: "Perfil A – Alta probabilidad de venta",
        bg: "#dcfce7",
        text: "#166534",
      },
      B: {
        label: "Perfil B – Interés moderado",
        bg: "#fef9c3",
        text: "#854d0e",
      },
      C: {
        label: "Perfil C – Sin urgencia de momento",
        bg: "#f1f5f9",
        text: "#475569",
      },
    };

  const badge = badges[result.category];

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 sm:p-8 animate-slide-up">
        {/* Agency label */}
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-6 text-center">
          {agencyName}
        </p>

        {/* Score */}
        <div className="text-center mb-6">
          <div
            className="inline-block text-6xl font-extrabold mb-3"
            style={{ color: brandColor }}
          >
            {result.score}
            <span className="text-2xl font-normal text-gray-300">/10</span>
          </div>
          <div>
            <span
              className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold"
              style={{ backgroundColor: badge.bg, color: badge.text }}
            >
              {badge.label}
            </span>
          </div>
        </div>

        {/* Copy */}
        <p className="text-gray-700 text-base leading-relaxed mb-8 text-center">
          {result.resultCopy}
        </p>

        {/* CTA */}
        <div
          className="rounded-xl p-5 mb-6 text-center"
          style={{ backgroundColor: `${brandColor}12` }}
        >
          <p className="font-semibold text-base" style={{ color: brandColor }}>
            Si quieres, te llamamos y lo vemos en 10 minutos.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Sin compromiso. Solo para resolver tus dudas.
          </p>
        </div>

        {/* Reset */}
        <div className="text-center">
          <button
            onClick={onReset}
            className="text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
          >
            Empezar de nuevo
          </button>
        </div>
      </div>
    </main>
  );
}

// ─── Step content renderer ────────────────────────────────────────────────────

function StepContent({
  step,
  data,
  errors,
  brandColor,
  updateField,
}: {
  step: number;
  data: Partial<WizardData>;
  errors: FieldErrors;
  brandColor: string;
  updateField: <K extends keyof WizardData>(key: K, value: WizardData[K]) => void;
}) {
  switch (step) {
    // ── Step 1: Intro ──────────────────────────────────────────────────────────
    case 1:
      return (
        <div className="text-center py-6 animate-fade-in">
          <div className="text-5xl mb-5">🏠</div>
          <h1 className="text-2xl font-extrabold text-gray-900 leading-tight mb-3">
            ¿Tu vivienda está en su mejor momento de mercado?
          </h1>
          <p className="text-gray-500 text-base leading-relaxed">
            Responde 8 preguntas y recibe un informe orientativo de tu zona en
            A Coruña.
          </p>
        </div>
      );

    // ── Step 2: Situación ──────────────────────────────────────────────────────
    case 2:
      return (
        <div className="animate-slide-up">
          <StepHeader title="¿Cuál describe mejor tu situación?" />
          <QuestionCard
            options={PROFILE_OPTIONS}
            selected={data.profile}
            onSelect={(v) => updateField("profile", v)}
            brandColor={brandColor}
          />
          {errors.profile && (
            <p className="mt-2 text-sm text-red-500">{errors.profile}</p>
          )}
        </div>
      );

    // ── Step 3: Barrio ─────────────────────────────────────────────────────────
    case 3:
      return (
        <div className="animate-slide-up">
          <StepHeader title="¿En qué zona o barrio está?" />
          <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-100 pr-1 space-y-2.5 py-1">
            {ZONE_NAMES.map((zone) => {
              const isSelected = data.zone === zone;
              return (
                <button
                  key={zone}
                  type="button"
                  onClick={() => updateField("zone", zone)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                    isSelected
                      ? "text-white border-transparent shadow-sm"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  style={
                    isSelected
                      ? {
                          backgroundColor: brandColor,
                          borderColor: brandColor,
                        }
                      : undefined
                  }
                >
                  {zone}
                </button>
              );
            })}
          </div>
          {errors.zone && (
            <p className="mt-2 text-sm text-red-500">{errors.zone}</p>
          )}
        </div>
      );

    // ── Step 4: Tipo ──────────────────────────────────────────────────────────
    case 4:
      return (
        <div className="animate-slide-up">
          <StepHeader title="¿Qué tipo de vivienda es?" />
          <QuestionCard
            options={PROPERTY_TYPE_OPTIONS}
            selected={data.propertyType}
            onSelect={(v) => updateField("propertyType", v)}
            brandColor={brandColor}
          />
          {errors.propertyType && (
            <p className="mt-2 text-sm text-red-500">{errors.propertyType}</p>
          )}
        </div>
      );

    // ── Step 5: Antigüedad ────────────────────────────────────────────────────
    case 5:
      return (
        <div className="animate-slide-up">
          <StepHeader title="¿Hace cuánto la compraste o la tienes?" />
          <QuestionCard
            options={PURCHASE_RANGE_OPTIONS}
            selected={data.purchaseRange}
            onSelect={(v) => updateField("purchaseRange", v)}
            brandColor={brandColor}
          />
          {errors.purchaseRange && (
            <p className="mt-2 text-sm text-red-500">{errors.purchaseRange}</p>
          )}
        </div>
      );

    // ── Step 6: Encaje ────────────────────────────────────────────────────────
    case 6:
      return (
        <div className="animate-slide-up">
          <StepHeader
            title="Del 1 al 5: ¿Te encaja esta vivienda para los próximos 3 años?"
            subtitle="1 = Nada, 5 = Perfecta"
          />
          <div className="flex gap-3 justify-center mt-2">
            {[1, 2, 3, 4, 5].map((n) => {
              const isSelected = data.satisfaction === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => updateField("satisfaction", n)}
                  className={`w-14 h-14 rounded-xl text-xl font-bold border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                    isSelected
                      ? "text-white border-transparent shadow-md scale-105"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:scale-105"
                  }`}
                  style={
                    isSelected
                      ? {
                          backgroundColor: brandColor,
                          borderColor: brandColor,
                        }
                      : undefined
                  }
                >
                  {n}
                </button>
              );
            })}
          </div>
          {errors.satisfaction && (
            <p className="mt-3 text-sm text-red-500 text-center">
              {errors.satisfaction}
            </p>
          )}
        </div>
      );

    // ── Step 7: Horizonte ─────────────────────────────────────────────────────
    case 7:
      return (
        <div className="animate-slide-up">
          <StepHeader title="Si cambiaras de vivienda, ¿cuándo sería?" />
          <QuestionCard
            options={INTENT_OPTIONS}
            selected={data.intent}
            onSelect={(v) => updateField("intent", v)}
            brandColor={brandColor}
          />
          {errors.intent && (
            <p className="mt-2 text-sm text-red-500">{errors.intent}</p>
          )}
        </div>
      );

    // ── Step 8: Compromiso ────────────────────────────────────────────────────
    case 8:
      return (
        <div className="animate-slide-up">
          <StepHeader title="¿Quieres que revisemos tu caso y te enviemos un informe orientativo?" />
          <QuestionCard
            options={ANALYSIS_OPTIONS}
            selected={data.analysisCommitment}
            onSelect={(v) => updateField("analysisCommitment", v)}
            brandColor={brandColor}
          />
          {errors.analysisCommitment && (
            <p className="mt-2 text-sm text-red-500">
              {errors.analysisCommitment}
            </p>
          )}
        </div>
      );

    // ── Step 9: Contacto ──────────────────────────────────────────────────────
    case 9:
      return (
        <div className="animate-slide-up">
          <StepHeader
            title="¿A dónde te enviamos el informe?"
            subtitle="Solo te contactaremos para enviarte el informe solicitado."
          />
          <div className="space-y-4">
            <Input
              label="Nombre"
              type="text"
              placeholder="Tu nombre"
              value={data.name ?? ""}
              onChange={(e) => updateField("name", e.target.value)}
              error={errors.name}
              autoComplete="given-name"
            />
            <Input
              label="Email"
              type="email"
              placeholder="tu@email.com"
              value={data.email ?? ""}
              onChange={(e) => updateField("email", e.target.value)}
              error={errors.email}
              autoComplete="email"
            />
            <Input
              label="Teléfono"
              type="tel"
              placeholder="+34 600 000 000"
              value={data.phone ?? ""}
              onChange={(e) => updateField("phone", e.target.value)}
              error={errors.phone}
              autoComplete="tel"
            />

            {/* Consent */}
            <div className="flex items-start gap-3 pt-2">
              <input
                id="consent"
                type="checkbox"
                checked={data.consent ?? false}
                onChange={(e) => updateField("consent", e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label
                htmlFor="consent"
                className="text-sm text-gray-600 leading-relaxed cursor-pointer"
              >
                Acepto ser contactado para recibir el informe orientativo sobre
                mi vivienda.
              </label>
            </div>
            {errors.consent && (
              <p className="text-sm text-red-500">{errors.consent}</p>
            )}

            {/* Privacy note */}
            <p className="text-xs text-gray-400 leading-relaxed">
              Tus datos se usan únicamente para enviarte el informe solicitado.
            </p>

            {/* Form-level error */}
            {errors.form && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-600">{errors.form}</p>
              </div>
            )}
          </div>
        </div>
      );

    default:
      return null;
  }
}

// ─── Main WizardShell ─────────────────────────────────────────────────────────

interface WizardShellProps {
  agency?: string;
}

export function WizardShell({ agency }: WizardShellProps) {
  const agencyConfig = getAgencyConfig(agency);
  const { brand_color: brandColor, agency_name: agencyName } = agencyConfig;

  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<Partial<WizardData>>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ResultData | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // ── Hydrate from localStorage ──────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as {
          currentStep?: number;
          data?: Partial<WizardData>;
        };
        if (parsed.currentStep && parsed.currentStep >= 1 && parsed.currentStep <= 9) {
          setCurrentStep(parsed.currentStep);
        }
        if (parsed.data) {
          setData(parsed.data);
        }
      }
    } catch {
      // ignore malformed storage
    }
    setHydrated(true);
  }, []);

  // ── Persist to localStorage ────────────────────────────────────────────────
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ currentStep, data })
      );
    } catch {
      // ignore storage errors (private mode, quota, etc.)
    }
  }, [currentStep, data, hydrated]);

  // ── Field updater ──────────────────────────────────────────────────────────
  const updateField = useCallback(
    <K extends keyof WizardData>(key: K, value: WizardData[K]) => {
      setData((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    []
  );

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setCurrentStep(1);
    setData({});
    setErrors({});
    setResult(null);
    setSubmitting(false);
  }, []);

  // ── Step validation ────────────────────────────────────────────────────────
  const validateStep = (step: number): boolean => {
    const next: FieldErrors = {};

    switch (step) {
      case 2:
        if (!data.profile) next.profile = "Por favor, selecciona una opción.";
        break;
      case 3:
        if (!data.zone) next.zone = "Por favor, selecciona tu zona.";
        break;
      case 4:
        if (!data.propertyType)
          next.propertyType = "Por favor, selecciona el tipo de vivienda.";
        break;
      case 5:
        if (!data.purchaseRange)
          next.purchaseRange = "Por favor, selecciona una opción.";
        break;
      case 6:
        if (!data.satisfaction)
          next.satisfaction = "Por favor, selecciona una puntuación.";
        break;
      case 7:
        if (!data.intent) next.intent = "Por favor, selecciona una opción.";
        break;
      case 8:
        if (!data.analysisCommitment)
          next.analysisCommitment = "Por favor, selecciona una opción.";
        break;
      case 9: {
        if (!data.name?.trim()) next.name = "El nombre es obligatorio.";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!data.email?.trim()) {
          next.email = "El email es obligatorio.";
        } else if (!emailRegex.test(data.email.trim())) {
          next.email = "Introduce un email válido.";
        }
        if (!data.phone?.trim()) next.phone = "El teléfono es obligatorio.";
        if (!data.consent) next.consent = "Debes aceptar el consentimiento para continuar.";
        break;
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // ── Navigation ─────────────────────────────────────────────────────────────
  const handleNext = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
      return;
    }
    if (validateStep(currentStep)) {
      setCurrentStep((s) => Math.min(s + 1, 9));
    }
  };

  const handleBack = () => {
    setErrors({});
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateStep(9)) return;
    setSubmitting(true);
    setErrors({});

    try {
      const url = agency ? `/api/submit?agency=${encodeURIComponent(agency)}` : "/api/submit";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = (await res.json()) as ApiSubmitResponse;

      if (json.ok) {
        setResult({
          score: json.score,
          category: json.category,
          resultCopy: json.resultCopy,
          delivered: json.delivered,
        });
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          // ignore
        }
      } else {
        setErrors({ form: json.error ?? "Error al enviar. Inténtalo de nuevo." });
      }
    } catch {
      setErrors({ form: "Error de conexión. Comprueba tu red e inténtalo de nuevo." });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading skeleton (pre-hydration) ──────────────────────────────────────
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
        <div
          className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: `${brandColor} transparent transparent transparent` }}
        />
      </div>
    );
  }

  // ── Result screen ──────────────────────────────────────────────────────────
  if (result) {
    return (
      <ResultScreen
        result={result}
        agencyName={agencyName}
        brandColor={brandColor}
        onReset={handleReset}
      />
    );
  }

  // ── Wizard UI ──────────────────────────────────────────────────────────────
  const showProgress = currentStep >= 2;
  const progressStep = currentStep - 1; // 1–8

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-5">
          <span
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: brandColor }}
          >
            {agencyName}
          </span>
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
            >
              Empezar de nuevo
            </button>
          )}
        </div>

        {/* Progress bar */}
        {showProgress && (
          <div className="mb-6">
            <ProgressBar
              current={progressStep}
              total={TOTAL_QUESTION_STEPS}
              brandColor={brandColor}
            />
          </div>
        )}

        {/* Step content */}
        <StepContent
          step={currentStep}
          data={data}
          errors={errors}
          brandColor={brandColor}
          updateField={updateField}
        />

        {/* Navigation */}
        <div
          className={`flex mt-8 gap-3 ${
            currentStep > 1 ? "justify-between" : "justify-center"
          }`}
        >
          {currentStep > 1 && (
            <Button variant="ghost" size="md" onClick={handleBack}>
              ← Atrás
            </Button>
          )}

          {currentStep < 9 ? (
            <Button
              variant="primary"
              size="md"
              brandColor={brandColor}
              onClick={handleNext}
            >
              {currentStep === 1 ? "Empezar →" : "Siguiente →"}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              brandColor={brandColor}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                    aria-hidden="true"
                  />
                  Enviando…
                </span>
              ) : (
                "Recibir mi informe →"
              )}
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
