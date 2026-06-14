export default function SettingsPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white">Settings</h1>
      <p className="mt-1 text-slate-400">Manage your account and integrations</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <a
          href="/settings/tokens"
          className="rounded-lg border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-600"
        >
          <h3 className="text-lg font-semibold text-white">API Tokens</h3>
          <p className="mt-2 text-sm text-slate-400">
            Create and manage API tokens for AI agents like Claude Code and Codex.
          </p>
        </a>
        <a
          href="/settings/integrations"
          className="rounded-lg border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-600"
        >
          <h3 className="text-lg font-semibold text-white">Integrations</h3>
          <p className="mt-2 text-sm text-slate-400">
            Connect Linear, GitHub, and other services.
          </p>
        </a>
      </div>
    </div>
  );
}
