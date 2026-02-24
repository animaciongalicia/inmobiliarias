import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Radar Propietario – A Coruña",
  description:
    "Descubre el momento de mercado de tu vivienda en A Coruña con nuestro informe orientativo gratuito.",
  openGraph: {
    title: "Radar Propietario – A Coruña",
    description:
      "Responde 8 preguntas y recibe un informe orientativo de tu zona en A Coruña.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
