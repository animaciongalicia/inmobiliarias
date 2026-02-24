import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="text-5xl mb-4">🏠</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Radar Propietario – A Coruña
        </h1>
        <p className="text-gray-500 mb-8">
          Responde 8 preguntas y recibe un informe orientativo sobre el momento
          de mercado de tu vivienda en A Coruña.
        </p>
        <Link
          href="/wizard"
          className="inline-flex items-center justify-center rounded-lg font-semibold bg-blue-700 text-white px-7 py-3 text-lg hover:opacity-90 transition-opacity"
        >
          Empezar ahora →
        </Link>
      </div>
    </main>
  );
}
