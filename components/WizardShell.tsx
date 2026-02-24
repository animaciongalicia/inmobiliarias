"use client";

import { useState, useEffect, useCallback } from "react";
import { ProgressBar } from "./ProgressBar";
import { StepHeader } from "./StepHeader";
import { QuestionCard } from "./QuestionCard";
import { Button } from "./Button";
import { Input } from "./Input";
import { getAgencyConfig } from "@/lib/agencies";
import { PRESET_ZONE_NAMES, CUSTOM_ZONE_LABEL } from "@/lib/zones";
import { WizardData, Category, ApiSubmitResponse } from "@/lib/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 10;           // steps 1–10 (1 = intro, 10 = contact)
const TOTAL_QUESTION_STEPS = 9;   // steps 2–10 shown in progress bar
const STORAGE_KEY = "radar_wizard_v2";

const PROFILE_OPTIONS = [
  "Heredé un piso y no sé qué hacer con él",
  "Tengo un piso alquilado y estoy harto de gestionarlo",
  "El piso lleva tiempo vacío y pagando gastos",
  "Quiero cambiar de vida pero el piso me lo impide",
  "Tengo capital bloqueado en ladrillo y necesito liquidez",
  "Hay un tema familiar sin resolver (herencia, separación)",
  "Solo quiero saber cuánto vale mi propiedad",
];

const FRENO_OPTIONS = [
  "No sé cuánto vale realmente mi propiedad",
  "No sé si es buen momento para vender o alquilar",
  "Miedo a arrepentirme o tomar la decisión equivocada",
  "Los trámites y la burocracia me agobian",
  "Desacuerdo familiar o situación complicada",
  "Nada me frena, solo busco información",
];

const PROPERTY_TYPE_OPTIONS = [
  "Piso",
  "Ático",
  "Dúplex",
  "Casa / Chalet",
  "Local comercial",
  "Garaje / Plaza",
  "Terreno o finca",
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
  "Sí, quiero que me llamen para verlo",
  "Solo quería el informe por ahora",
];

// ─── Types ────────────────────────────────────────────────────────────────────

type FieldErrors = Partial<Record<keyof WizardData | "form" | "customZone", string>>;

interface ResultData {
  score: number;
  category: Category;
  resultCopy: string;
  delivered: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Copy personalizado del paso de contacto según el perfil declarado. */
function getContactTitle(profile: string | undefined): { title: string; subtitle: string } {
  switch (profile) {
    case "Heredé un piso y no sé qué hacer con él":
      return {
        title: "Te orientamos sin rodeos jurídicos ni presión",
        subtitle: "Dinos dónde contactarte y te explicamos tus opciones reales en 10 minutos.",
      };
    case "Tengo un piso alquilado y estoy harto de gestionarlo":
      return {
        title: "Hay opciones para dejar de gestionar hoy mismo",
        subtitle: "Te contamos alternativas reales — venta, gestión delegada, o algo intermedio.",
      };
    case "El piso lleva tiempo vacío y pagando gastos":
      return {
        title: "Calculamos exactamente cuánto te cuesta cada mes de espera",
        subtitle: "Es un dato que necesitas conocer para decidir con cabeza, no con emoción.",
      };
    case "Quiero cambiar de vida pero el piso me lo impide":
      return {
        title: "Te ayudamos a dar el paso con seguridad y sin sustos",
        subtitle: "Muchos propietarios descubren que el proceso es mucho más sencillo de lo que imaginaban.",
      };
    case "Tengo capital bloqueado en ladrillo y necesito liquidez":
      return {
        title: "Te mostramos qué rendimiento real podrías obtener",
        subtitle: "Comparamos el coste de oportunidad de tu piso con alternativas de inversión actuales.",
      };
    case "Hay un tema familiar sin resolver (herencia, separación)":
      return {
        title: "Lo analizamos con discreción, sin juzgar y sin complicarlo",
        subtitle: "Estas situaciones tienen más salida de la que parece. Te la explicamos.",
      };
    default:
      return {
        title: "¿A dónde te enviamos tu informe de mercado?",
        subtitle: "Solo te contactaremos para enviarte el informe solicitado. Sin spam.",
      };
  }
}

// ─── Result Screen ────────────────────────────────────────────────────────────

function ResultScreen({
  result,
  profile,
  agencyName,
  brandColor,
  onReset,
}: {
  result: ResultData;
  profile: string | undefined;
  agencyName: string;
  brandColor: string;
  onReset: () => void;
}) {
  const badges: Record<Category, { label: string; bg: string; text: string }> = {
    A: { label: "Perfil A — Alta probabilidad de acción", bg: "#dcfce7", text: "#166534" },
    B: { label: "Perfil B — Interés real, maduración en curso", bg: "#fef9c3", text: "#854d0e" },
    C: { label: "Perfil C — Sin urgencia de momento", bg: "#f1f5f9", text: "#475569" },
  };

  const ctaByCategory: Record<Category, string> = {
    A: "Tu caso tiene todos los ingredientes para resolverse bien y rápido. Si quieres, te llamamos y lo vemos en 10 minutos.",
    B: "No hay prisa, pero la información nunca viene mal. Si tienes dudas concretas, podemos resolverlas sin compromiso.",
    C: "Conocer el valor real de tu propiedad siempre es un punto de partida inteligente, aunque no tengas prisa por decidir.",
  };

  const badge = badges[result.category];

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 sm:p-8 animate-slide-up">

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

        {/* Copy personalizado de mercado */}
        <p className="text-gray-700 text-base leading-relaxed mb-6 text-center">
          {result.resultCopy}
        </p>

        {/* CTA personalizado por categoría */}
        <div
          className="rounded-xl p-5 mb-6 text-center"
          style={{ backgroundColor: `${brandColor}12` }}
        >
          <p className="font-semibold text-base" style={{ color: brandColor }}>
            {ctaByCategory[result.category]}
          </p>
          <p className="text-sm text-gray-500 mt-1">Sin compromiso. Sin presión.</p>
        </div>

        {/* Perfil identificado */}
        {profile && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm text-gray-600">
            <span className="font-semibold text-gray-700">Tu situación: </span>
            {profile}
          </div>
        )}

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

// ─── Step Content ─────────────────────────────────────────────────────────────

function StepContent({
  step,
  data,
  errors,
  brandColor,
  updateField,
  customZoneMode,
  customZoneText,
  onSelectCustomZone,
  onCustomZoneTextChange,
}: {
  step: number;
  data: Partial<WizardData>;
  errors: FieldErrors;
  brandColor: string;
  updateField: <K extends keyof WizardData>(key: K, value: WizardData[K]) => void;
  customZoneMode: boolean;
  customZoneText: string;
  onSelectCustomZone: () => void;
  onCustomZoneTextChange: (v: string) => void;
}) {
  switch (step) {

    // ── Step 1: Intro ──────────────────────────────────────────────────────────
    case 1:
      return (
        <div className="text-center py-4 animate-fade-in">
          <div className="text-5xl mb-5">🔍</div>
          <h1 className="text-2xl font-extrabold text-gray-900 leading-tight mb-3">
            ¿Tienes una propiedad que te genera más dudas que beneficios?
          </h1>
          <p className="text-gray-500 text-base leading-relaxed mb-5">
            En 9 preguntas identificamos exactamente tu situación y te decimos
            qué está pasando en tu mercado <strong>ahora mismo</strong>.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 text-left">
            <strong>Cada mes sin decidir tiene un coste real.</strong>{" "}
            Este análisis te ayuda a ver si ese coste merece la pena — o no.
          </div>
        </div>
      );

    // ── Step 2: Situación vital ────────────────────────────────────────────────
    case 2:
      return (
        <div className="animate-slide-up">
          <StepHeader
            title="¿Cuál de estas situaciones describe mejor lo que te pasa?"
            subtitle="Sé honesto — cuanto más preciso seas, mejor podremos ayudarte."
          />
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

    // ── Step 3: Freno principal (NUEVO) ────────────────────────────────────────
    case 3:
      return (
        <div className="animate-slide-up">
          <StepHeader
            title="¿Qué es lo que más te frena para tomar una decisión?"
            subtitle="No hay respuesta mala. Esto nos ayuda a orientarte mejor."
          />
          <QuestionCard
            options={FRENO_OPTIONS}
            selected={data.freno}
            onSelect={(v) => updateField("freno", v)}
            brandColor={brandColor}
          />
          {errors.freno && (
            <p className="mt-2 text-sm text-red-500">{errors.freno}</p>
          )}
        </div>
      );

    // ── Step 4: Barrio / Zona ──────────────────────────────────────────────────
    case 4:
      return (
        <div className="animate-slide-up">
          <StepHeader
            title="¿En qué zona o municipio está la propiedad?"
            subtitle="Selecciona el más cercano o escribe el tuyo."
          />
          <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-100 pr-1 space-y-2 py-1 mb-3">
            {PRESET_ZONE_NAMES.map((zone) => {
              const isSelected = !customZoneMode && data.zone === zone;
              return (
                <button
                  key={zone}
                  type="button"
                  onClick={() => updateField("zone", zone)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all duration-150 focus:outline-none ${
                    isSelected
                      ? "text-white border-transparent shadow-sm"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  style={isSelected ? { backgroundColor: brandColor, borderColor: brandColor } : undefined}
                >
                  {zone}
                </button>
              );
            })}
            {/* Opción abierta */}
            <button
              type="button"
              onClick={onSelectCustomZone}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all duration-150 focus:outline-none ${
                customZoneMode
                  ? "text-white border-transparent shadow-sm"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
              }`}
              style={customZoneMode ? { backgroundColor: brandColor, borderColor: brandColor } : undefined}
            >
              {CUSTOM_ZONE_LABEL}
            </button>
          </div>

          {/* Campo libre cuando eligen "Otro municipio" */}
          {customZoneMode && (
            <Input
              label="Escribe tu municipio o zona"
              type="text"
              placeholder="Ej. Ferrol, Betanzos, Pontedeume…"
              value={customZoneText}
              onChange={(e) => onCustomZoneTextChange(e.target.value)}
              error={errors.customZone}
              autoComplete="off"
            />
          )}

          {errors.zone && !customZoneMode && (
            <p className="mt-2 text-sm text-red-500">{errors.zone}</p>
          )}
        </div>
      );

    // ── Step 5: Tipo de inmueble ───────────────────────────────────────────────
    case 5:
      return (
        <div className="animate-slide-up">
          <StepHeader title="¿Qué tipo de propiedad es?" />
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

    // ── Step 6: Antigüedad ────────────────────────────────────────────────────
    case 6:
      return (
        <div className="animate-slide-up">
          <StepHeader
            title="¿Cuánto tiempo llevas como propietario?"
            subtitle="El tiempo en propiedad influye en la plusvalía y en la tributación final."
          />
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

    // ── Step 7: Nivel de incomodidad ──────────────────────────────────────────
    case 7:
      return (
        <div className="animate-slide-up">
          <StepHeader
            title="¿Cuánto te pesa esta situación en tu día a día?"
            subtitle="1 = No me preocupa · 5 = Me genera mucho estrés o coste"
          />
          <div className="flex gap-3 justify-center mt-4">
            {[1, 2, 3, 4, 5].map((n) => {
              const isSelected = data.satisfaction === n;
              const labels = ["", "Nada", "Poco", "Algo", "Bastante", "Mucho"];
              return (
                <div key={n} className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => updateField("satisfaction", n)}
                    className={`w-14 h-14 rounded-xl text-xl font-bold border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                      isSelected
                        ? "text-white border-transparent shadow-md scale-105"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:scale-105"
                    }`}
                    style={
                      isSelected
                        ? { backgroundColor: brandColor, borderColor: brandColor }
                        : undefined
                    }
                  >
                    {n}
                  </button>
                  <span className="text-xs text-gray-400">{labels[n]}</span>
                </div>
              );
            })}
          </div>
          {errors.satisfaction && (
            <p className="mt-3 text-sm text-red-500 text-center">{errors.satisfaction}</p>
          )}
        </div>
      );

    // ── Step 8: Horizonte temporal ────────────────────────────────────────────
    case 8:
      return (
        <div className="animate-slide-up">
          <StepHeader
            title="¿En qué plazo podrías tomar una decisión sobre esta propiedad?"
            subtitle="Si nunca decides, el mercado decide por ti."
          />
          <QuestionCard
            options={INTENT_OPTIONS}
            selected={data.intent}
            onSelect={(v) => updateField("intent", v)}
            brandColor={brandColor}
          />
          {/* Coste de oportunidad contextual */}
          <div className="mt-4 bg-slate-50 rounded-xl px-4 py-3 text-xs text-slate-500 leading-relaxed">
            💡 Cada mes de espera puede suponer entre <strong>600€ y 1.400€</strong> en
            coste de oportunidad — entre gastos fijos y rentabilidad no generada.
          </div>
          {errors.intent && (
            <p className="mt-2 text-sm text-red-500">{errors.intent}</p>
          )}
        </div>
      );

    // ── Step 9: Compromiso de análisis ────────────────────────────────────────
    case 9:
      return (
        <div className="animate-slide-up">
          <StepHeader
            title="¿Quieres que un especialista analice tu caso y te lo explique sin rodeos?"
            subtitle="Sin compromiso de venta. Solo para que tengas información real sobre tu situación."
          />
          <QuestionCard
            options={ANALYSIS_OPTIONS}
            selected={data.analysisCommitment}
            onSelect={(v) => updateField("analysisCommitment", v)}
            brandColor={brandColor}
          />
          {errors.analysisCommitment && (
            <p className="mt-2 text-sm text-red-500">{errors.analysisCommitment}</p>
          )}
        </div>
      );

    // ── Step 10: Contacto (personalizado) ─────────────────────────────────────
    case 10: {
      const { title, subtitle } = getContactTitle(data.profile);
      return (
        <div className="animate-slide-up">
          <StepHeader title={title} subtitle={subtitle} />
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
                Acepto ser contactado para recibir el informe sobre mi propiedad.
              </label>
            </div>
            {errors.consent && (
              <p className="text-sm text-red-500">{errors.consent}</p>
            )}

            <p className="text-xs text-gray-400 leading-relaxed">
              Tus datos se usan únicamente para enviarte el informe solicitado.
              No compartimos tu información con terceros.
            </p>

            {errors.form && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-600">{errors.form}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

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

  // Custom zone state
  const [customZoneMode, setCustomZoneMode] = useState(false);
  const [customZoneText, setCustomZoneText] = useState("");

  // ── Hydrate from localStorage ──────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as {
          currentStep?: number;
          data?: Partial<WizardData>;
          customZoneMode?: boolean;
          customZoneText?: string;
        };
        if (parsed.currentStep && parsed.currentStep >= 1 && parsed.currentStep <= TOTAL_STEPS) {
          setCurrentStep(parsed.currentStep);
        }
        if (parsed.data) setData(parsed.data);
        if (parsed.customZoneMode) setCustomZoneMode(parsed.customZoneMode);
        if (parsed.customZoneText) setCustomZoneText(parsed.customZoneText);
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
        JSON.stringify({ currentStep, data, customZoneMode, customZoneText })
      );
    } catch {
      // ignore
    }
  }, [currentStep, data, customZoneMode, customZoneText, hydrated]);

  // ── Field updater ──────────────────────────────────────────────────────────
  const updateField = useCallback(
    <K extends keyof WizardData>(key: K, value: WizardData[K]) => {
      setData((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      // When a preset zone is selected, exit custom mode
      if (key === "zone") {
        setCustomZoneMode(false);
        setCustomZoneText("");
      }
    },
    []
  );

  // ── Custom zone handlers ───────────────────────────────────────────────────
  const handleSelectCustomZone = useCallback(() => {
    setCustomZoneMode(true);
    setData((prev) => ({ ...prev, zone: "" }));
    setErrors((prev) => { const n = { ...prev }; delete n.zone; delete n.customZone; return n; });
  }, []);

  const handleCustomZoneTextChange = useCallback((v: string) => {
    setCustomZoneText(v);
    setData((prev) => ({ ...prev, zone: v.trim() }));
    setErrors((prev) => { const n = { ...prev }; delete n.customZone; delete n.zone; return n; });
  }, []);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setCurrentStep(1);
    setData({});
    setErrors({});
    setResult(null);
    setSubmitting(false);
    setCustomZoneMode(false);
    setCustomZoneText("");
  }, []);

  // ── Step validation ────────────────────────────────────────────────────────
  const validateStep = (step: number): boolean => {
    const next: FieldErrors = {};

    switch (step) {
      case 2:
        if (!data.profile) next.profile = "Por favor, selecciona una opción.";
        break;
      case 3:
        if (!data.freno) next.freno = "Por favor, selecciona una opción.";
        break;
      case 4:
        if (customZoneMode) {
          if (!customZoneText.trim()) next.customZone = "Por favor, escribe tu municipio o zona.";
        } else {
          if (!data.zone) next.zone = "Por favor, selecciona tu zona.";
        }
        break;
      case 5:
        if (!data.propertyType) next.propertyType = "Por favor, selecciona el tipo de propiedad.";
        break;
      case 6:
        if (!data.purchaseRange) next.purchaseRange = "Por favor, selecciona una opción.";
        break;
      case 7:
        if (!data.satisfaction) next.satisfaction = "Por favor, selecciona una puntuación.";
        break;
      case 8:
        if (!data.intent) next.intent = "Por favor, selecciona una opción.";
        break;
      case 9:
        if (!data.analysisCommitment) next.analysisCommitment = "Por favor, selecciona una opción.";
        break;
      case 10: {
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
      setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS));
    }
  };

  const handleBack = () => {
    setErrors({});
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateStep(10)) return;
    setSubmitting(true);
    setErrors({});

    try {
      const url = agency
        ? `/api/submit?agency=${encodeURIComponent(agency)}`
        : "/api/submit";
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
        try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
      } else {
        setErrors({ form: json.error ?? "Error al enviar. Inténtalo de nuevo." });
      }
    } catch {
      setErrors({ form: "Error de conexión. Comprueba tu red e inténtalo de nuevo." });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────
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
        profile={data.profile}
        agencyName={agencyName}
        brandColor={brandColor}
        onReset={handleReset}
      />
    );
  }

  // ── Wizard UI ──────────────────────────────────────────────────────────────
  const showProgress = currentStep >= 2;
  const progressStep = currentStep - 1; // 1–9

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
          customZoneMode={customZoneMode}
          customZoneText={customZoneText}
          onSelectCustomZone={handleSelectCustomZone}
          onCustomZoneTextChange={handleCustomZoneTextChange}
        />

        {/* Navigation */}
        <div
          className={`flex mt-8 gap-3 ${currentStep > 1 ? "justify-between" : "justify-center"}`}
        >
          {currentStep > 1 && (
            <Button variant="ghost" size="md" onClick={handleBack}>
              ← Atrás
            </Button>
          )}

          {currentStep < TOTAL_STEPS ? (
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
