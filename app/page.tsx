import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">

        {/* Franja de color — misma que el wizard */}
        <div className="h-1.5 bg-blue-700" />

        <div className="px-8 pt-8 pb-6 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h1 className="text-2xl font-extrabold text-gray-900 leading-tight mb-3">
            Ese piso que no sabes qué hacer con él<br />
            te está costando dinero cada mes.
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            IBI, comunidad, seguro, derramas…<br />
            Y mientras tanto, el mercado no espera.
          </p>
        </div>

        <div className="px-8 pb-2">
          {/* Coste de oportunidad */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
            <p className="text-amber-800 text-sm font-bold mb-1">
              ¿Sabes cuánto estás perdiendo cada mes?
            </p>
            <p className="text-amber-700 text-sm leading-relaxed">
              Un piso vacío o mal rentabilizado en A Coruña supone perder entre{" "}
              <strong>600€ y 1.400€ al mes</strong> en coste de oportunidad real.
              Dinero que no recuperarás.
            </p>
          </div>

          {/* Inclusión indecisos */}
          <p className="text-gray-600 text-sm leading-relaxed text-center mb-5">
            Responde <strong>9 preguntas</strong> y descubre qué está pasando con
            tu propiedad — <span className="text-gray-500">aunque no hayas decidido nada todavía.</span>
          </p>

          <Link
            href="/wizard"
            className="flex items-center justify-center w-full rounded-xl font-bold bg-blue-700 text-white px-7 py-4 text-lg hover:bg-blue-800 transition-colors"
          >
            Quiero saber qué vale mi piso →
          </Link>

          <p className="text-xs text-center text-gray-400 mt-3 mb-6">
            Sin compromiso · Sin spam · Solo claridad sobre tu situación real
          </p>
        </div>

        {/* Trust bar */}
        <div className="border-t border-gray-100 px-8 py-5 flex justify-around text-center">
          <div>
            <p className="font-extrabold text-gray-900 text-lg">2 min</p>
            <p className="text-xs text-gray-400 mt-0.5">para completarlo</p>
          </div>
          <div className="border-l border-gray-100" />
          <div>
            <p className="font-extrabold text-gray-900 text-lg">Gratis</p>
            <p className="text-xs text-gray-400 mt-0.5">sin compromiso</p>
          </div>
          <div className="border-l border-gray-100" />
          <div>
            <p className="font-extrabold text-gray-900 text-lg">100%</p>
            <p className="text-xs text-gray-400 mt-0.5">confidencial</p>
          </div>
        </div>

      </div>
    </main>
  );
}
