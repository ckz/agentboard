import { LinearClient } from "@linear/sdk";

export class LinearService {
  private client: LinearClient;
  private teamId: string;

  constructor(apiKey: string, teamId: string) {
    this.client = new LinearClient({ apiKey });
    this.teamId = teamId;
  }

  /**
   * Create a Linear issue from a task.
   */
  async createIssue(task: {
    title: string;
    description?: string | null;
    priority?: number;
    labels?: string[];
  }) {
    const payload = await this.client.createIssue({
      teamId: this.teamId,
      title: task.title,
      description: task.description || undefined,
      priority: task.priority || 0,
      labelIds: task.labels?.length ? await this.resolveLabelIds(task.labels) : undefined,
    });

    const issue = await payload.issue;
    return {
      id: issue?.id,
      url: issue?.url,
      identifier: issue?.identifier,
    };
  }

  /**
   * Update a Linear issue.
   */
  async updateIssue(
    issueId: string,
    updates: {
      title?: string;
      description?: string;
      priority?: number;
      stateId?: string;
    }
  ) {
    const payload = await this.client.updateIssue(issueId, updates);
    const issue = await payload.issue;
    return {
      id: issue?.id,
      url: issue?.url,
    };
  }

  /**
   * Get Linear workflow states for the team.
   */
  async getStates() {
    const team = await this.client.team(this.teamId);
    const states = await team.states();
    return states.nodes.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      color: s.color,
    }));
  }

  /**
   * Map Agentboard status to Linear state ID.
   */
  async mapStatusToStateId(status: string): Promise<string | undefined> {
    const states = await this.getStates();
    const statusMap: Record<string, string> = {
      backlog: "backlog",
      todo: "unstarted",
      in_progress: "started",
      review: "started",
      done: "completed",
    };

    const targetType = statusMap[status];
    const state = states.find((s) => s.type === targetType);
    return state?.id;
  }

  /**
   * Resolve label names to Linear label IDs. Creates labels if they don't exist.
   */
  private async resolveLabelIds(labelNames: string[]): Promise<string[]> {
    const existing = await this.client.issueLabels({ filter: { name: { in: labelNames } } });
    const existingMap = new Map(existing.nodes.map((l) => [l.name, l.id]));

    const ids: string[] = [];
    for (const name of labelNames) {
      if (existingMap.has(name)) {
        ids.push(existingMap.get(name)!);
      } else {
        const created = await this.client.createIssueLabel({
          teamId: this.teamId,
          name,
          color: "#8b8b8b",
        });
        const label = await created.issueLabel;
        if (label) ids.push(label.id);
      }
    }

    return ids;
  }
}

/**
 * Map Linear priority number to Agentboard priority.
 * Linear: 0=No priority, 1=Urgent, 2=High, 3=Medium, 4=Low
 * Agentboard: 0=none, 1=low, 2=medium, 3=high, 4=urgent
 */
export function linearToAgentboardPriority(linearPriority: number): number {
  const map: Record<number, number> = { 0: 0, 1: 4, 2: 3, 3: 2, 4: 1 };
  return map[linearPriority] ?? 0;
}

/**
 * Map Agentboard priority to Linear priority.
 */
export function agentboardToLinearPriority(priority: number): number {
  const map: Record<number, number> = { 0: 0, 1: 4, 2: 3, 3: 2, 4: 1 };
  return map[priority] ?? 0;
}
