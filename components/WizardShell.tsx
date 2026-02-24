"use client";

import { useState, useEffect, useCallback } from "react";
import { ProgressBar } from "./ProgressBar";
import { StepHeader } from "./StepHeader";
import { QuestionCard } from "./QuestionCard";
import { Button } from "./Button";
import { Input } from "./Input";
import { getAgencyConfig } from "@/lib/agencies";
import { PRESET_ZONE_NAMES, CUSTOM_ZONE_LABEL, getZoneInfo } from "@/lib/zones";
import { WizardData, Category, ApiSubmitResponse } from "@/lib/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 11;            // 1=intro … 11=contacto
const TOTAL_QUESTION_STEPS = 10;   // pasos 2–11 en barra de progreso
const STORAGE_KEY = "radar_wizard_v3";

const PROFILE_OPTIONS = [
  "Heredé un piso y no sé qué hacer con él",
  "Tengo un piso alquilado y estoy harto de gestionarlo",
  "El piso lleva tiempo vacío y pagando gastos",
  "Estoy en proceso de separación o divorcio",
  "Quiero cambiar de vida pero el piso me lo impide",
  "Tengo capital bloqueado en ladrillo y necesito liquidez",
  "Algo me dice que podría ser el momento, pero no lo tengo claro",
  "Solo quiero saber cuánto vale, sin compromiso",
];

const FRENO_OPTIONS = [
  "No sé cuánto vale realmente mi propiedad",
  "No sé cuánto tendría que pagar de impuestos (plusvalía, IRPF)",
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

// ─── Helper: coste acumulado ──────────────────────────────────────────────────

function computeAccumulatedCost(
  propertyType: string | undefined,
  purchaseRange: string | undefined,
  zone: string | undefined
): { monthlyMin: number; monthlyMax: number; totalMin: number; totalMax: number; years: number } {
  // Coste de oportunidad mensual estimado (min, max) por tipo de inmueble
  const monthlyCostByType: Record<string, [number, number]> = {
    "Piso":            [650, 1200],
    "Ático":           [850, 1500],
    "Dúplex":          [700, 1300],
    "Casa / Chalet":   [900, 1900],
    "Local comercial": [500, 1100],
    "Garaje / Plaza":  [80,  180],
    "Terreno o finca": [200, 600],
    "Otro":            [500, 1000],
  };

  // Multiplicador por zona (refleja nivel de precios de alquiler)
  const zoneMultipliers: Record<string, number> = {
    "Ensanche":              1.35,
    "Centro / Ciudad Vieja": 1.30,
    "Riazor / Ciudad Jardín":1.25,
    "Oleiros":               1.25,
    "Monte Alto":            1.20,
    "Orillamar":             1.15,
    "Cuatro Caminos":        1.10,
    "Matogrande":            1.10,
    "Sagrada Familia":       1.05,
    "Los Rosales":           1.05,
    "Sada":                  1.00,
    "Labañou":               1.00,
    "Agra do Orzán":         0.95,
    "Os Mallos":             0.95,
    "Castrillón":            0.90,
    "Elviña / Campus":       0.90,
    "Arteixo":               0.90,
    "Cambre":                0.88,
    "Culleredo":             0.85,
    "Mesoiro":               0.85,
    "Feáns / Palavea":       0.82,
    "Eirís":                 0.80,
  };

  // Años estimados por rango de tenencia
  const yearsByRange: Record<string, number> = {
    "Menos de 5 años": 3,
    "5–10 años":       7,
    "10–20 años":      15,
    "Más de 20 años":  25,
    "Herencia":        10,
  };

  const [baseMin, baseMax] = monthlyCostByType[propertyType ?? ""] ?? [500, 1000];
  const multiplier = zoneMultipliers[zone ?? ""] ?? 1.0;
  const years = yearsByRange[purchaseRange ?? ""] ?? 5;

  // Redondear a múltiplos de 50 (mensual) y 1000 (total)
  const monthlyMin = Math.round(baseMin * multiplier / 50) * 50;
  const monthlyMax = Math.round(baseMax * multiplier / 50) * 50;
  const totalMin   = Math.round(monthlyMin * 12 * years / 1000) * 1000;
  const totalMax   = Math.round(monthlyMax * 12 * years / 1000) * 1000;

  return { monthlyMin, monthlyMax, totalMin, totalMax, years };
}

// ─── Helper: título personalizado del paso de contacto ───────────────────────

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
    case "Estoy en proceso de separación o divorcio":
      return {
        title: "Lo gestionamos con absoluta discreción y sin añadir presión",
        subtitle: "Lo importante ahora es tener la información clara para poder avanzar. Nada más.",
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
    case "Algo me dice que podría ser el momento, pero no lo tengo claro":
      return {
        title: "Ese pálpito suele tener base real",
        subtitle: "Te ayudamos a entender si el mercado en tu zona te da la razón — sin decidir nada todavía.",
      };
    case "Solo quiero saber cuánto vale, sin compromiso":
      return {
        title: "Una valoración honesta, sin que nadie te llame cinco veces",
        subtitle: "Te enviamos el informe y, si quieres más información, decides tú cuándo y cómo.",
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
  propertyType,
  zone,
  agencyName,
  brandColor,
  whatsappNumber,
  onReset,
}: {
  result: ResultData;
  profile: string | undefined;
  propertyType: string | undefined;
  zone: string | undefined;
  agencyName: string;
  brandColor: string;
  whatsappNumber?: string;
  onReset: () => void;
}) {
  const [callbackDay, setCallbackDay]   = useState("");
  const [callbackTime, setCallbackTime] = useState("");

  const badges: Record<Category, { label: string; bg: string; text: string }> = {
    A: { label: "Perfil A — Alta probabilidad de acción",      bg: "#dcfce7", text: "#166534" },
    B: { label: "Perfil B — Interés real, maduración en curso", bg: "#fef9c3", text: "#854d0e" },
    C: { label: "Perfil C — Sin urgencia de momento",           bg: "#f1f5f9", text: "#475569" },
  };

  const ctaByCategory: Record<Category, string> = {
    A: "Tu caso tiene todos los ingredientes para resolverse bien y rápido.",
    B: "No hay prisa, pero la información nunca viene mal. Podemos resolver tus dudas sin compromiso.",
    C: "Conocer el valor real de tu propiedad siempre es un punto de partida inteligente.",
  };

  const badge = badges[result.category];

  const whatsappMsg = `Hola, acabo de hacer el análisis Radar Propietario. Tengo ${propertyType ?? "una propiedad"} en ${zone ?? "mi zona"} y quiero saber más.`;
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappMsg)}`
    : null;

  const DAYS  = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  const TIMES = ["Mañana (9–12h)", "Mediodía (12–15h)", "Tarde (15–20h)"];

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden animate-slide-up">
        <div className="h-1.5 bg-blue-700" />
        <div className="p-6 sm:p-8">

          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-6 text-center">
            {agencyName}
          </p>

          {/* Score */}
          <div className="text-center mb-5">
            <div className="inline-block text-6xl font-extrabold mb-3" style={{ color: brandColor }}>
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

          {/* Copy de mercado */}
          <p className="text-gray-700 text-sm leading-relaxed mb-5 text-center">
            {result.resultCopy}
          </p>

          {/* CTA contextual */}
          <div className="rounded-xl p-4 mb-5 text-center" style={{ backgroundColor: `${brandColor}12` }}>
            <p className="font-semibold text-sm" style={{ color: brandColor }}>
              {ctaByCategory[result.category]}
            </p>
            <p className="text-xs text-gray-500 mt-1">Sin compromiso. Sin presión.</p>
          </div>

          {/* ── WhatsApp ─────────────────────────────────────────────────────── */}
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-xl font-bold bg-green-500 text-white px-5 py-3.5 mb-3 hover:bg-green-600 transition-colors text-sm"
            >
              {/* WhatsApp icon */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Hablar por WhatsApp ahora
            </a>
          )}

          {/* ── Agenda de llamada ─────────────────────────────────────────────── */}
          <div className="border border-gray-100 rounded-xl p-4 mb-5">
            <p className="text-sm font-semibold text-gray-700 mb-3 text-center">
              ¿Cuándo te viene bien que te llamemos?
            </p>

            {/* Días */}
            <div className="flex flex-wrap gap-2 mb-3 justify-center">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => { setCallbackDay(day); setCallbackTime(""); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-all ${
                    callbackDay === day
                      ? "text-white border-transparent"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                  style={callbackDay === day ? { backgroundColor: brandColor, borderColor: brandColor } : undefined}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Franjas horarias — aparecen al elegir día */}
            {callbackDay && (
              <div className="flex flex-wrap gap-2 justify-center animate-fade-in">
                {TIMES.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setCallbackTime(time)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-all ${
                      callbackTime === time
                        ? "text-white border-transparent"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                    style={callbackTime === time ? { backgroundColor: brandColor, borderColor: brandColor } : undefined}
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}

            {/* Confirmación */}
            {callbackDay && callbackTime && (
              <div className="mt-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center animate-fade-in">
                <p className="text-green-700 text-xs font-semibold">
                  Anotado. Intentaremos llamarte el{" "}
                  <strong>{callbackDay}</strong> por la{" "}
                  <strong>{callbackTime.split(" ")[0].toLowerCase()}</strong>.
                </p>
                <p className="text-green-600 text-xs mt-0.5">
                  Ya tenemos tu teléfono del formulario.
                </p>
              </div>
            )}
          </div>

          {/* Perfil identificado */}
          {profile && (
            <div className="bg-gray-50 rounded-xl px-4 py-3 mb-5 text-xs text-gray-500">
              <span className="font-semibold text-gray-600">Tu situación: </span>
              {profile}
            </div>
          )}

          <div className="text-center">
            <button
              onClick={onReset}
              className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
            >
              Empezar de nuevo
            </button>
          </div>

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
            ¿Tienes una propiedad y no sabes muy bien qué hacer con ella?
          </h1>
          <p className="text-gray-500 text-base leading-relaxed mb-5">
            No hace falta tener nada decidido.<br />
            En 10 preguntas te damos <strong>información real</strong> sobre tu
            situación — sin presión, sin compromiso.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 text-left">
            <strong>Lo que sí deberías saber:</strong>{" "}
            cada mes sin información clara tiene un coste que se acumula.
            Este análisis te ayuda a verlo con perspectiva.
          </div>
        </div>
      );

    // ── Step 2: Situación vital ────────────────────────────────────────────────
    case 2:
      return (
        <div className="animate-slide-up">
          <StepHeader
            title="¿Cuál de estas situaciones describe mejor lo que te pasa?"
            subtitle="No hace falta tener nada decidido. Elige la que más se acerque."
          />
          <QuestionCard
            options={PROFILE_OPTIONS}
            selected={data.profile}
            onSelect={(v) => updateField("profile", v)}
            brandColor={brandColor}
          />
          {errors.profile && <p className="mt-2 text-sm text-red-500">{errors.profile}</p>}
        </div>
      );

    // ── Step 3: Freno principal ────────────────────────────────────────────────
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
          {errors.freno && <p className="mt-2 text-sm text-red-500">{errors.freno}</p>}
        </div>
      );

    // ── Step 4: Zona — con dato de mercado en tiempo real ──────────────────────
    case 4: {
      const zoneInfo = data.zone && !customZoneMode ? getZoneInfo(data.zone) : null;
      return (
        <div className="animate-slide-up">
          <StepHeader
            title="¿En qué zona o municipio está la propiedad?"
            subtitle="Selecciona el más cercano o escribe el tuyo."
          />
          <div className="max-h-56 overflow-y-auto rounded-xl border border-gray-100 pr-1 space-y-2 py-1 mb-3">
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

          {/* ── Dato de mercado en tiempo real ── */}
          {zoneInfo && (
            <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 animate-fade-in">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">
                Mercado en {data.zone}
              </p>
              <p className="text-xs text-blue-800 leading-relaxed">{zoneInfo.tendencia}</p>
            </div>
          )}

          {errors.zone && !customZoneMode && (
            <p className="mt-2 text-sm text-red-500">{errors.zone}</p>
          )}
        </div>
      );
    }

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
          {errors.propertyType && <p className="mt-2 text-sm text-red-500">{errors.propertyType}</p>}
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
          {errors.purchaseRange && <p className="mt-2 text-sm text-red-500">{errors.purchaseRange}</p>}
        </div>
      );

    // ── Step 7: Espejo de coste acumulado ─────────────────────────────────────
    case 7: {
      const { monthlyMin, monthlyMax, totalMin, totalMax, years } = computeAccumulatedCost(
        data.propertyType,
        data.purchaseRange,
        data.zone
      );
      const fmt = (n: number) => n.toLocaleString("es-ES");
      const isGarage = data.propertyType === "Garaje / Plaza";

      return (
        <div className="animate-slide-up text-center">
          <div className="text-4xl mb-3">💸</div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-2 leading-snug">
            Aquí está el número que nadie te había dicho.
          </h2>
          <p className="text-gray-500 text-sm mb-5 leading-relaxed">
            Basado en tu {isGarage ? "plaza/garaje" : "propiedad"}, tu zona ({data.zone ?? "—"})
            y el tiempo que llevas como propietario:
          </p>

          {/* Coste mensual */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl px-5 py-5 mb-4">
            <p className="text-xs text-amber-600 font-bold uppercase tracking-wide mb-1">
              Coste de oportunidad mensual estimado
            </p>
            <p className="text-4xl font-extrabold text-amber-700">
              {fmt(monthlyMin)}€ – {fmt(monthlyMax)}€
            </p>
            <p className="text-amber-600 text-xs mt-1">en valor no generado cada mes</p>
          </div>

          {/* Coste acumulado */}
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 mb-4 text-center">
            <p className="text-sm text-red-700">
              Si llevas ~{years} años en esta situación, el coste acumulado estimado es:
            </p>
            <p className="text-2xl font-extrabold text-red-700 mt-1">
              {fmt(totalMin)}€ – {fmt(totalMax)}€
            </p>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Estimación orientativa basada en precios de alquiler de mercado y gastos fijos habituales en tu zona.
            No incluye la variación del precio del propio inmueble.
          </p>
        </div>
      );
    }

    // ── Step 8: Nivel de incomodidad ──────────────────────────────────────────
    case 8:
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
                    style={isSelected ? { backgroundColor: brandColor, borderColor: brandColor } : undefined}
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

    // ── Step 9: Horizonte temporal ────────────────────────────────────────────
    case 9:
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
          <div className="mt-4 bg-slate-50 rounded-xl px-4 py-3 text-xs text-slate-500 leading-relaxed">
            💡 Cada mes de espera puede suponer entre <strong>600€ y 1.400€</strong> en
            coste de oportunidad — entre gastos fijos y rentabilidad no generada.
          </div>
          {errors.intent && <p className="mt-2 text-sm text-red-500">{errors.intent}</p>}
        </div>
      );

    // ── Step 10: Compromiso de análisis ───────────────────────────────────────
    case 10:
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

    // ── Step 11: Contacto (personalizado) ─────────────────────────────────────
    case 11: {
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
              <label htmlFor="consent" className="text-sm text-gray-600 leading-relaxed cursor-pointer">
                Acepto ser contactado para recibir el informe sobre mi propiedad.
              </label>
            </div>
            {errors.consent && <p className="text-sm text-red-500">{errors.consent}</p>}

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
  const { brand_color: brandColor, agency_name: agencyName, whatsapp: whatsappNumber } = agencyConfig;

  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData]               = useState<Partial<WizardData>>({});
  const [errors, setErrors]           = useState<FieldErrors>({});
  const [submitting, setSubmitting]   = useState(false);
  const [result, setResult]           = useState<ResultData | null>(null);
  const [hydrated, setHydrated]       = useState(false);

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
        if (parsed.data)           setData(parsed.data);
        if (parsed.customZoneMode) setCustomZoneMode(parsed.customZoneMode);
        if (parsed.customZoneText) setCustomZoneText(parsed.customZoneText);
      }
    } catch { /* ignore */ }
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
    } catch { /* ignore */ }
  }, [currentStep, data, customZoneMode, customZoneText, hydrated]);

  // ── Field updater ──────────────────────────────────────────────────────────
  const updateField = useCallback(
    <K extends keyof WizardData>(key: K, value: WizardData[K]) => {
      setData((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
      if (key === "zone") { setCustomZoneMode(false); setCustomZoneText(""); }
    },
    []
  );

  // ── Custom zone ────────────────────────────────────────────────────────────
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
      case 2:  if (!data.profile)   next.profile   = "Por favor, selecciona una opción."; break;
      case 3:  if (!data.freno)     next.freno      = "Por favor, selecciona una opción."; break;
      case 4:
        if (customZoneMode) {
          if (!customZoneText.trim()) next.customZone = "Por favor, escribe tu municipio o zona.";
        } else {
          if (!data.zone) next.zone = "Por favor, selecciona tu zona.";
        }
        break;
      case 5:  if (!data.propertyType)       next.propertyType       = "Por favor, selecciona el tipo de propiedad."; break;
      case 6:  if (!data.purchaseRange)      next.purchaseRange      = "Por favor, selecciona una opción."; break;
      // case 7: pantalla de espejo, sin input obligatorio
      case 8:  if (!data.satisfaction)       next.satisfaction       = "Por favor, selecciona una puntuación."; break;
      case 9:  if (!data.intent)             next.intent             = "Por favor, selecciona una opción."; break;
      case 10: if (!data.analysisCommitment) next.analysisCommitment = "Por favor, selecciona una opción."; break;
      case 11: {
        if (!data.name?.trim()) next.name = "El nombre es obligatorio.";
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!data.email?.trim())             next.email   = "El email es obligatorio.";
        else if (!emailRe.test(data.email.trim())) next.email = "Introduce un email válido.";
        if (!data.phone?.trim())             next.phone   = "El teléfono es obligatorio.";
        if (!data.consent)                   next.consent = "Debes aceptar el consentimiento para continuar.";
        break;
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // ── Navigation ─────────────────────────────────────────────────────────────
  const handleNext = () => {
    if (currentStep === 1) { setCurrentStep(2); return; }
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
    if (!validateStep(11)) return;
    setSubmitting(true);
    setErrors({});
    try {
      const url = agency ? `/api/submit?agency=${encodeURIComponent(agency)}` : "/api/submit";
      const res  = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = (await res.json()) as ApiSubmitResponse;
      if (json.ok) {
        setResult({ score: json.score, category: json.category, resultCopy: json.resultCopy, delivered: json.delivered });
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

  // ── Loading ────────────────────────────────────────────────────────────────
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

  // ── Result ─────────────────────────────────────────────────────────────────
  if (result) {
    return (
      <ResultScreen
        result={result}
        profile={data.profile}
        propertyType={data.propertyType}
        zone={data.zone}
        agencyName={agencyName}
        brandColor={brandColor}
        whatsappNumber={whatsappNumber}
        onReset={handleReset}
      />
    );
  }

  // ── Wizard UI ──────────────────────────────────────────────────────────────
  const showProgress  = currentStep >= 2;
  const progressStep  = currentStep - 1; // 1–10

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="h-1.5 bg-blue-700" style={{ backgroundColor: brandColor }} />
        <div className="p-6 sm:p-8">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-5">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: brandColor }}>
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
              <ProgressBar current={progressStep} total={TOTAL_QUESTION_STEPS} brandColor={brandColor} />
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
          <div className={`flex mt-8 gap-3 ${currentStep > 1 ? "justify-between" : "justify-center"}`}>
            {currentStep > 1 && (
              <Button variant="ghost" size="md" onClick={handleBack}>← Atrás</Button>
            )}

            {currentStep < TOTAL_STEPS ? (
              <Button variant="primary" size="md" brandColor={brandColor} onClick={handleNext}>
                {currentStep === 1 ? "Empezar →" : currentStep === 7 ? "Entendido → Continuar" : "Siguiente →"}
              </Button>
            ) : (
              <Button variant="primary" size="md" brandColor={brandColor} onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                    Enviando…
                  </span>
                ) : "Recibir mi informe →"}
              </Button>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
