export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { validateSubmitBody } from "@/lib/validators";
import { computeScore } from "@/lib/scoring";
import { getAgencyConfig, getWebhookUrl } from "@/lib/agencies";
import { getZoneInfo } from "@/lib/zones";
import { Category, WizardData } from "@/lib/types";

function buildResultCopy(data: WizardData, category: Category): string {
  const info = getZoneInfo(data.zone);

  // Copy personalizado según la situación vital del propietario
  const profileContext: Partial<Record<string, string>> = {
    "Heredé un piso y no sé qué hacer con él":
      "Las herencias sin resolver son uno de los casos donde el mercado puede trabajar a tu favor — si actúas en el momento adecuado.",
    "Tengo un piso alquilado y estoy harto de gestionarlo":
      "Muchos propietarios en tu situación descubren que vender ahora les genera más liquidez que años de alquiler con todas las molestias incluidas.",
    "El piso lleva tiempo vacío y pagando gastos":
      "Cada mes que pasa es dinero que no vuelve. El mercado actual en tu zona tiene demanda real.",
    "Estoy en proceso de separación o divorcio":
      "Resolver el inmueble antes cierra un capítulo importante y abre caminos. Con el mercado actual hay margen para hacerlo bien y sin conflictos añadidos.",
    "Quiero cambiar de vida pero el piso me lo impide":
      "El piso no tiene por qué ser un ancla. Con la estrategia correcta, puede ser exactamente el trampolín que necesitas.",
    "Tengo capital bloqueado en ladrillo y necesito liquidez":
      "Tu propiedad puede estar generando mucho menos de lo que podría. Una valoración honesta te dará el mapa completo.",
    "Algo me dice que podría ser el momento, pero no lo tengo claro":
      "Que estés aquí ya dice algo. Los propietarios que se informan a tiempo obtienen mejores resultados que los que esperan a estar seguros al 100%.",
    "Solo quiero saber cuánto vale, sin compromiso":
      "Tener este dato claro cambia la perspectiva. Muchos propietarios descubren que su propiedad vale más — o en mejor momento — de lo que pensaban.",
  };

  const profilePhrase =
    profileContext[data.profile] ??
    "Conocer el valor real de tu propiedad es siempre el primer paso para tomar una decisión inteligente.";

  const categoryPhrasing: Record<Category, string> = {
    A: `${profilePhrase} ${info.tendencia} ${info.oportunidad}`,
    B: `${profilePhrase} ${info.tendencia} ${info.alerta}`,
    C: `${profilePhrase} ${info.tendencia} Una valoración sin compromiso siempre es información útil, independientemente de cuándo decidas actuar.`,
  };

  return categoryPhrasing[category];
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Cuerpo de la petición no es JSON válido." },
      { status: 400 }
    );
  }

  const agencyParam = req.nextUrl.searchParams.get("agency");
  const agencyConfig = getAgencyConfig(agencyParam);

  const validation = validateSubmitBody(body);
  if (!validation.valid) {
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: 400 }
    );
  }

  const { data } = validation;
  const { score, category } = computeScore(data);
  const resultCopy = buildResultCopy(data, category);

  const leadPayload = {
    ...data,
    agency_id: agencyConfig.agency_id,
    agency_name: agencyConfig.agency_name,
    score,
    category,
    submitted_at: new Date().toISOString(),
  };

  const webhookUrl = getWebhookUrl(agencyConfig);
  let delivered = false;

  if (webhookUrl) {
    try {
      const webhookRes = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadPayload),
        signal: AbortSignal.timeout(10_000),
      });
      if (webhookRes.ok) {
        delivered = true;
      } else {
        console.error(
          `[submit] Webhook HTTP ${webhookRes.status} for agency ${agencyConfig.agency_id}`
        );
      }
    } catch (err) {
      console.error("[submit] Webhook delivery failed:", err);
    }
  } else {
    console.warn(
      "[submit] No webhook URL configured. Set MAKE_WEBHOOK_DEFAULT in environment variables."
    );
  }

  return NextResponse.json({ ok: true, score, category, resultCopy, delivered });
}
