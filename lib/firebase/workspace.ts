// Workspace types — extensible for payment integration later

export type WorkspaceMemberRole =
  | "owner"
  | "admin"
  | "member"
  | "contributor"
  | "investor"
  | "guest";

export type WorkspaceEntityType = "project" | "startup";

export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "open" | "in_progress" | "review" | "done";
export type MilestoneStatus = "upcoming" | "in_progress" | "completed" | "missed";
export type InviteStatus = "pending" | "accepted" | "expired";

export interface WorkspaceColumn {
  id: string;
  title: string;
  color: string; // tailwind bg class
  order: number;
}

export interface Workspace {
  id: string;
  ownerId: string;
  entityId: string;          // projectId or startupId
  entityType: WorkspaceEntityType;
  name: string;
  planTier: string;          // mirrors owner's plan_tier
  columns: WorkspaceColumn[];
  createdAt: string;
  updatedAt: string;
  // extensible: paymentEnabled?: boolean (Phase X)
}

export interface WorkspaceTask {
  id: string;
  workspaceId: string;
  columnId: string;
  title: string;
  description?: string;
  assignedTo?: string;       // uid
  assignedName?: string;     // display name cache
  dueDate?: string;          // ISO date
  priority: TaskPriority;
  order: number;
  createdBy: string;
  createdAt: string;
  // extensible: milestoneId?, paymentTrigger? (Phase X)
}

export interface WorkspaceMember {
  uid: string;
  workspaceId: string;
  role: WorkspaceMemberRole;
  full_name: string;
  avatar?: string;
  joinedAt: string;
  invitedBy: string;
  // extensible: contractId?, equityPercent? (Phase X)
}

export interface WorkspaceInvite {
  id: string;
  workspaceId: string;
  workspaceName: string;
  invitedBy: string;
  invitedByName: string;
  email?: string;
  uid?: string;              // if invited by DADORI username
  role: WorkspaceMemberRole;
  token: string;
  status: InviteStatus;
  expiresAt: string;
  createdAt: string;
}

export interface WorkspaceMilestone {
  id: string;
  workspaceId: string;
  title: string;
  description?: string;
  dueDate: string;
  status: MilestoneStatus;
  assignedTo?: string;
  createdAt: string;
  // extensible: paymentTrigger?, amount? (Phase X)
}

export interface WorkspaceAIMessage {
  id: string;
  workspaceId: string;
  uid: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

// Default columns for new workspaces
export const DEFAULT_COLUMNS: WorkspaceColumn[] = [
  { id: "todo",        title: "To Do",       color: "bg-zinc-100",   order: 0 },
  { id: "in_progress", title: "In Progress", color: "bg-blue-100",   order: 1 },
  { id: "review",      title: "Review",      color: "bg-amber-100",  order: 2 },
  { id: "done",        title: "Done",        color: "bg-green-100",  order: 3 },
];

// Tier limits
export function workspaceLimit(tier: string) {
  switch (tier) {
    case "scale": return { members: Infinity, boards: Infinity, ai: Infinity };
    case "pro":   return { members: 25,       boards: Infinity, ai: 10 };
    default:      return { members: 3,        boards: 1,        ai: 0 };
  }
}

export function canUseAI(tier: string) {
  return tier === "pro" || tier === "scale";
}

export function canAccessDataRoom(tier: string) {
  return tier === "pro" || tier === "scale";
}
