import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-2xl font-bold text-white">
            A
          </div>
          <h1 className="text-4xl font-bold text-white">Agentboard</h1>
        </div>
        <p className="mb-4 text-xl text-slate-300">
          AI-agent-friendly project task management
        </p>
        <p className="mb-12 text-slate-400">
          Built for teams that use Linear. First-class API access for Claude Code,
          Codex, and other AI agents via tokens.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-medium text-white transition hover:bg-blue-700"
          >
            Sign in with Google
          </Link>
          <a
            href="/api/v1/agent/me"
            className="rounded-lg border border-slate-600 px-8 py-3 text-lg font-medium text-slate-300 transition hover:border-slate-400 hover:text-white"
          >
            API Docs
          </a>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-8 text-left">
          <FeatureCard
            title="Kanban Boards"
            description="Drag-and-drop task management with customizable columns and WIP limits."
          />
          <FeatureCard
            title="Linear Sync"
            description="Bidirectional sync with Linear. Tasks stay in sync across both tools."
          />
          <FeatureCard
            title="Agent API"
            description="REST API with Bearer token auth. Claude Code and Codex can read and write tasks."
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm text-slate-400">{description}</p>
    </div>
  );
}
