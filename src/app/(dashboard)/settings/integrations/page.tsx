"use client";

import { useState } from "react";

export default function IntegrationsPage() {
  const [linearStatus, setLinearStatus] = useState<any>(null);

  async function checkLinearStatus() {
    const res = await fetch("/api/v1/sync/linear/status");
    const { data } = await res.json();
    setLinearStatus(data);
  }

  async function syncLinear() {
    const res = await fetch("/api/v1/sync/linear", { method: "POST" });
    const { data } = await res.json();
    alert(`Synced ${data.synced} tasks`);
    checkLinearStatus();
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white">Integrations</h1>
      <p className="mt-1 text-slate-400">Connect external services</p>

      <div className="mt-8 space-y-6">
        {/* Linear */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Linear</h2>
              <p className="mt-1 text-sm text-slate-400">
                Bidirectional sync with Linear issues
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={checkLinearStatus}
                className="rounded border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
              >
                Check Status
              </button>
              <button
                onClick={syncLinear}
                className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
              >
                Sync Now
              </button>
            </div>
          </div>

          {linearStatus && (
            <div className="mt-4 rounded bg-slate-800 p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-white">
                    {linearStatus.totalTasks}
                  </p>
                  <p className="text-xs text-slate-400">Total Tasks</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">
                    {linearStatus.synced}
                  </p>
                  <p className="text-xs text-slate-400">Synced</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-400">
                    {linearStatus.unsynced}
                  </p>
                  <p className="text-xs text-slate-400">Unsynced</p>
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-slate-500">
                {linearStatus.configured
                  ? "Linear integration is configured"
                  : "Set LINEAR_API_KEY and LINEAR_TEAM_ID in environment"}
              </p>
            </div>
          )}

          <div className="mt-4 text-sm text-slate-500">
            <p>Environment variables needed:</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-slate-600">
              <li><code className="text-slate-400">LINEAR_API_KEY</code> — Linear API key</li>
              <li><code className="text-slate-400">LINEAR_TEAM_ID</code> — Target team ID</li>
              <li><code className="text-slate-400">LINEAR_WEBHOOK_SECRET</code> — Webhook HMAC secret</li>
            </ul>
          </div>
        </div>

        {/* GitHub */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-white">GitHub</h2>
          <p className="mt-1 text-sm text-slate-400">
            Link PRs to tasks and commit via PAT
          </p>
          <div className="mt-4 text-sm text-slate-500">
            <p>Environment variables needed:</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-slate-600">
              <li><code className="text-slate-400">GITHUB_PAT</code> — Personal Access Token</li>
              <li><code className="text-slate-400">GITHUB_WEBHOOK_SECRET</code> — Webhook secret</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
