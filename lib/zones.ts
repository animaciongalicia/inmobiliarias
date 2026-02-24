import { ZoneInfo } from "./types";

export const zones: Record<string, ZoneInfo> = {
  "Monte Alto": {
    tendencia:
      "Zona consolidada con demanda estable y perfiles de comprador solvente.",
    oportunidad:
      "Las viviendas bien mantenidas tienen buena salida en el mercado actual, especialmente con vistas al mar.",
    alerta:
      "La oferta es limitada; si el precio no es competitivo, puede alargarse el tiempo de venta.",
  },
  "Los Rosales": {
    tendencia:
      "Barrio familiar con buena conectividad y demanda creciente entre familias jóvenes.",
    oportunidad:
      "El mercado muestra interés sostenido en inmuebles de mediano tamaño bien comunicados.",
    alerta:
      "La competencia con obra nueva en zonas limítrofes puede influir en el tiempo de venta.",
  },
  Matogrande: {
    tendencia: "Zona residencial consolidada con perfil de comprador estable.",
    oportunidad:
      "Alta demanda de pisos amplios por parte de familias que priorizan calidad de vida y servicios cercanos.",
    alerta:
      "La renovación de la vivienda puede ser determinante para destacar frente a inmuebles más modernos.",
  },
  Elviña: {
    tendencia:
      "Área en transformación con creciente interés por su proximidad al campus universitario.",
    oportunidad:
      "Demanda constante de perfil inversor y comprador joven con visión a medio plazo.",
    alerta:
      "El mercado puede ser más sensible al precio que en zonas más céntricas de la ciudad.",
  },
  Centro: {
    tendencia:
      "Alta rotación y demanda activa impulsada por la centralidad y los servicios.",
    oportunidad:
      "Inmuebles únicos o con características singulares tienen un comprador específico dispuesto a valorarlos.",
    alerta:
      "La variabilidad de precios es elevada según la calle y el estado de conservación del inmueble.",
  },
  "Cuatro Caminos": {
    tendencia: "Zona céntrica con alta densidad y demanda diversa y activa.",
    oportunidad:
      "Buena liquidez del mercado para viviendas bien posicionadas en precio.",
    alerta:
      "La concentración de oferta puede requerir estrategias de diferenciación para cerrar ventas con agilidad.",
  },
  Riazor: {
    tendencia:
      "Demanda sostenida impulsada por el entorno costero y el acceso a servicios y ocio.",
    oportunidad:
      "Perfil de comprador con capacidad adquisitiva interesado en calidad de vida y entorno.",
    alerta:
      "Las expectativas de precio son elevadas, lo que requiere una valoración muy precisa para no desviar la demanda.",
  },
  Labañou: {
    tendencia: "Barrio residencial tranquilo con demanda familiar estable.",
    oportunidad:
      "Buenas condiciones para una venta ordenada en un mercado sólido y sin grandes sobresaltos.",
    alerta:
      "La percepción de menor dinamismo comercial puede ser un freno para ciertos perfiles de comprador.",
  },
  "Agra do Orzán": {
    tendencia:
      "Zona con demanda activa y precios más accesibles que en otras áreas céntricas.",
    oportunidad:
      "Atractiva para compradores primerizos e inversores por su relación precio-ubicación.",
    alerta:
      "El estado de conservación del inmueble tiene un impacto directo en el precio final obtenido.",
  },
  Mesoiro: {
    tendencia: "Área periférica con crecimiento residencial gradual.",
    oportunidad:
      "Interés creciente de familias que priorizan espacio y tranquilidad sobre la centralidad.",
    alerta:
      "La dependencia del vehículo privado puede limitar el perfil de comprador interesado.",
  },
  Eirís: {
    tendencia: "Zona en proceso de consolidación con demanda moderada.",
    oportunidad:
      "El precio de entrada más accesible atrae a un perfil de comprador en expansión.",
    alerta:
      "La percepción de ubicación periférica puede alargar el proceso de venta respecto a zonas más céntricas.",
  },
  Orillamar: {
    tendencia: "Barrio histórico con carácter propio y demanda de perfil cultural.",
    oportunidad:
      "Los inmuebles con encanto o rehabilitados tienen buena acogida entre compradores selectivos.",
    alerta:
      "El mercado es nicho y puede requerir más tiempo para encontrar al comprador adecuado.",
  },
};

export const DEFAULT_ZONE_INFO: ZoneInfo = {
  tendencia: "Zona con mercado activo y demanda sostenida en A Coruña.",
  oportunidad:
    "Hay interés real de compradores que buscan vivienda en tu área.",
  alerta:
    "Una valoración precisa es clave para no dejar dinero sobre la mesa.",
};

export function getZoneInfo(zone: string): ZoneInfo {
  return zones[zone] ?? DEFAULT_ZONE_INFO;
}

export const ZONE_NAMES = Object.keys(zones);
