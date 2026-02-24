export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { validateSubmitBody } from "@/lib/validators";
import { computeScore } from "@/lib/scoring";
import { getAgencyConfig, getWebhookUrl } from "@/lib/agencies";
import { getZoneInfo } from "@/lib/zones";
import { Category } from "@/lib/types";

function buildResultCopy(zone: string, category: Category): string {
  const info = getZoneInfo(zone);

  const categoryPhrasing: Record<Category, string> = {
    A: `Tu perfil encaja con propietarios que habitualmente avanzan en un plazo de pocos meses. ${info.tendencia} ${info.oportunidad}`,
    B: `Tu situación muestra interés real, aunque aún con margen de reflexión. ${info.tendencia} ${info.alerta}`,
    C: `De momento no parece haber urgencia, pero conocer el valor de tu vivienda siempre es un punto de partida inteligente. ${info.tendencia}`,
  };

  return categoryPhrasing[category];
}

export async function POST(req: NextRequest) {
  // Parse JSON body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Cuerpo de la petición no es JSON válido." },
      { status: 400 }
    );
  }

  // Resolve agency from query param
  const agencyParam = req.nextUrl.searchParams.get("agency");
  const agencyConfig = getAgencyConfig(agencyParam);

  // Validate inputs
  const validation = validateSubmitBody(body);
  if (!validation.valid) {
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: 400 }
    );
  }

  const { data } = validation;

  // Compute score + category
  const { score, category } = computeScore(data);

  // Build result copy
  const resultCopy = buildResultCopy(data.zone, category);

  // Build full lead payload for Make
  const leadPayload = {
    ...data,
    agency_id: agencyConfig.agency_id,
    agency_name: agencyConfig.agency_name,
    score,
    category,
    submitted_at: new Date().toISOString(),
  };

  // Send to Make webhook
  const webhookUrl = getWebhookUrl(agencyConfig);
  let delivered = false;

  if (webhookUrl) {
    try {
      const webhookRes = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadPayload),
        signal: AbortSignal.timeout(10_000), // 10s timeout
      });

      if (webhookRes.ok) {
        delivered = true;
      } else {
        console.error(
          `[submit] Webhook responded with HTTP ${webhookRes.status} for agency ${agencyConfig.agency_id}`
        );
      }
    } catch (err) {
      console.error("[submit] Webhook delivery failed:", err);
    }
  } else {
    console.warn(
      "[submit] No webhook URL configured. Set MAKE_WEBHOOK_DEFAULT (or MAKE_WEBHOOK_CORUNA01) in environment variables."
    );
  }

  return NextResponse.json({ ok: true, score, category, resultCopy, delivered });
}
