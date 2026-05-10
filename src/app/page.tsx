export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center space-y-8 px-4">
        <h1 className="text-5xl md:text-6xl font-bold text-white">OpenMind OS</h1>
        <p className="text-xl text-slate-300">AI-Powered Personal Cognitive Operating System</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/dashboard" className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
            Dashboard
          </a>
          <a href="/login" className="px-8 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-semibold">
            Login
          </a>
        </div>
        <div className="pt-8 border-t border-slate-700 mt-12">
          <p className="text-sm text-slate-400">Backend API: <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 font-semibold">http://localhost:8000/docs</a></p>
          <p className="text-sm text-slate-500 mt-2">Database Status: ✅ Connected</p>
        </div>
      </div>
    </div>
  );
}
