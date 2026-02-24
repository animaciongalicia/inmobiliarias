import { WizardData, Category, ScoreResult } from "./types";

/**
 * Lead scoring — máximo 10 puntos.
 *
 * A) profile (situación vital)      → 0-2 pts
 * B) freno (qué le bloquea)         → 0-2 pts
 * C) satisfaction (cuánto le pesa)  → 0-2 pts  [ESCALA: 1=nada, 5=mucho]
 * D) intent (horizonte temporal)    → 0-3 pts
 * E) purchaseRange (antigüedad)     → 0-1 pts
 *
 * analysisCommitment se recoge solo para cualificar la llamada; no puntúa.
 */
export function computeScore(data: Partial<WizardData>): ScoreResult {
  let score = 0;

  // A) Situación vital — perfiles de alta urgencia puntúan más
  switch (data.profile) {
    case "Heredé un piso y no sé qué hacer con él":
      score += 2;
      break;
    case "Tengo un piso alquilado y estoy harto de gestionarlo":
      score += 2;
      break;
    case "El piso lleva tiempo vacío y pagando gastos":
      score += 2;
      break;
    case "Hay un tema familiar sin resolver (herencia, separación)":
      score += 2;
      break;
    case "Quiero cambiar de vida pero el piso me lo impide":
      score += 1;
      break;
    case "Tengo capital bloqueado en ladrillo y necesito liquidez":
      score += 1;
      break;
    // "Solo quiero saber cuánto vale mi propiedad" → +0
  }

  // B) Freno — cuanto más concreto y resoluble por la agencia, más puntúa
  switch (data.freno) {
    case "No sé cuánto vale realmente mi propiedad":
      score += 2; // la agencia resuelve esto de inmediato
      break;
    case "No sé si es buen momento para vender o alquilar":
      score += 1;
      break;
    case "Miedo a arrepentirme o tomar la decisión equivocada":
      score += 1;
      break;
    case "Los trámites y la burocracia me agobian":
      score += 1;
      break;
    // "Desacuerdo familiar o situación complicada" → +0 (proceso más lento)
    // "Nada me frena, solo busco información" → +0 (baja urgencia)
  }

  // C) Nivel de incomodidad — escala 1 (no le pesa) a 5 (mucho estrés/coste)
  //    Nota: escala INVERTIDA respecto a la versión anterior.
  const sat = Number(data.satisfaction);
  if (sat >= 4) {
    score += 2; // alta incomodidad = quiere resolver cuanto antes
  } else if (sat === 3) {
    score += 1;
  }
  // 1-2 → +0 (no le pesa, sin urgencia real)

  // D) Horizonte temporal
  switch (data.intent) {
    case "0–6 meses":
      score += 3;
      break;
    case "6–12 meses":
      score += 2;
      break;
    case "12–24 meses":
      score += 1;
      break;
    case "No lo sé":
      score += 1;
      break;
    // "Más adelante" → +0
  }

  // E) Antigüedad en propiedad — mayor antigüedad = más plusvalía acumulada = más motivación
  switch (data.purchaseRange) {
    case "Más de 20 años":
      score += 1;
      break;
    case "10–20 años":
      score += 1;
      break;
    case "Herencia":
      score += 1;
      break;
    // resto → +0
  }

  score = Math.min(10, Math.max(0, score));

  let category: Category;
  if (score <= 3) {
    category = "C";
  } else if (score <= 6) {
    category = "B";
  } else {
    category = "A";
  }

  return { score, category };
}
