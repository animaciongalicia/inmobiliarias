import { WizardData, Category, ScoreResult } from "./types";

export function computeScore(data: Partial<WizardData>): ScoreResult {
  let score = 0;

  // A) intent
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
    // "Más adelante" +0
  }

  // B) satisfaction (1–5)
  const sat = Number(data.satisfaction);
  if (sat >= 1 && sat <= 2) {
    score += 2;
  } else if (sat === 3) {
    score += 1;
  }
  // 4–5 +0

  // C) profile
  switch (data.profile) {
    case "Es una herencia":
      score += 2;
      break;
    case "Está vacía":
      score += 2;
      break;
    case "Estoy pensando en cambiar de casa":
      score += 1;
      break;
    case "La tengo alquilada":
      score += 1;
      break;
    // "Vivo en la vivienda" +0
    // "No lo había pensado hasta ahora" +0
  }

  // D) purchaseRange
  switch (data.purchaseRange) {
    case "10–20 años":
      score += 1;
      break;
    case "Más de 20 años":
      score += 1;
      break;
    case "Herencia":
      score += 1;
      break;
    // else +0
  }

  // E) analysisCommitment
  if (data.analysisCommitment === "Sí, análisis personalizado") {
    score += 2;
  }

  // Cap at 10
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
