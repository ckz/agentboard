"use client";

import { useState, useEffect } from "react";

interface Token {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  agentType: string | null;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export default function TokensPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    agentType: "claude-code",
    scopes: ["read", "write"],
  });

  useEffect(() => {
    fetchTokens();
  }, []);

  async function fetchTokens() {
    const res = await fetch("/api/v1/auth/token");
    const { data } = await res.json();
    setTokens(data || []);
  }

  async function createToken() {
    const res = await fetch("/api/v1/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const { data } = await res.json();
    if (data?.token) {
      setNewToken(data.token);
      setShowCreate(false);
      fetchTokens();
    }
  }

  async function revokeToken(id: string) {
    await fetch(`/api/v1/auth/token?id=${id}`, { method: "DELETE" });
    fetchTokens();
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">API Tokens</h1>
          <p className="mt-1 text-slate-400">
            Create tokens for AI agents to access the API
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Create Token
        </button>
      </div>

      {/* New token alert */}
      {newToken && (
        <div className="mb-6 rounded-lg border border-green-600 bg-green-600/10 p-4">
          <p className="text-sm font-medium text-green-400">
            Token created! Copy it now — it won&apos;t be shown again.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 rounded bg-slate-900 p-3 text-sm text-white font-mono break-all">
              {newToken}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(newToken);
              }}
              className="rounded bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600"
            >
              Copy
            </button>
          </div>
          <button
            onClick={() => setNewToken(null)}
            className="mt-2 text-xs text-slate-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="mb-6 rounded-lg border border-slate-700 bg-slate-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">New Token</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Claude Code Agent"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white placeholder-slate-500 outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Agent Type</label>
              <select
                value={form.agentType}
                onChange={(e) => setForm({ ...form, agentType: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-blue-600"
              >
                <option value="claude-code">Claude Code</option>
                <option value="codex">Codex</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={createToken}
                disabled={!form.name}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Token list */}
      <div className="space-y-3">
        {tokens.length === 0 && !showCreate && (
          <div className="rounded-lg border border-dashed border-slate-700 p-12 text-center">
            <p className="text-slate-400">No tokens yet</p>
            <p className="mt-2 text-sm text-slate-500">
              Create a token to let AI agents access the API.
            </p>
          </div>
        )}

        {tokens.map((token) => (
          <div
            key={token.id}
            className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 p-4"
          >
            <div>
              <p className="font-medium text-white">{token.name}</p>
              <p className="mt-1 text-xs text-slate-500 font-mono">
                {token.prefix}...
              </p>
              <div className="mt-2 flex gap-2">
                {token.agentType && (
                  <span className="rounded bg-purple-600/20 px-2 py-0.5 text-xs text-purple-400">
                    {token.agentType}
                  </span>
                )}
                {token.scopes?.map((scope) => (
                  <span
                    key={scope}
                    className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-300"
                  >
                    {scope}
                  </span>
                ))}
                {token.lastUsedAt && (
                  <span className="text-xs text-slate-600">
                    Last used: {new Date(token.lastUsedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => revokeToken(token.id)}
              className="rounded px-3 py-1 text-xs text-red-400 hover:bg-red-600/10"
            >
              Revoke
            </button>
          </div>
        ))}
      </div>

      {/* Usage instructions */}
      <div className="mt-8 rounded-lg border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-3 text-lg font-semibold text-white">Usage</h2>
        <div className="space-y-3 text-sm text-slate-400">
          <p>
            Use your token in the <code className="text-slate-300">Authorization</code> header:
          </p>
          <pre className="rounded bg-slate-800 p-3 text-xs text-slate-300 overflow-x-auto">
{`curl -H "Authorization: Bearer ab_your_token_here" \\
  https://agentboard.vercel.app/api/v1/tasks`}
          </pre>
          <p>
            For Claude Code, add to your MCP config:
          </p>
          <pre className="rounded bg-slate-800 p-3 text-xs text-slate-300 overflow-x-auto">
{`{
  "mcpServers": {
    "agentboard": {
      "url": "https://agentboard.vercel.app/api/mcp",
      "headers": {
        "Authorization": "Bearer ab_your_token_here"
      }
    }
  }
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
