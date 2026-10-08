import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-900 p-4">
      <h2 className="text-4xl font-bold mb-4">Página não encontrada</h2>
      <p className="mb-8 text-slate-600">Ops! Parece que você está fora de mercado.</p>
      <Link 
        href="/"
        className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition"
      >
        Voltar para a página inicial
      </Link>
    </div>
  );
}
