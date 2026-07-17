import { tasksDao } from "../dao/tasks";
import type { Task, TaskStatus } from "../schemas";

const TERMINAL: TaskStatus[] = ["succeeded", "failed", "timeout", "token_limit"];

export function isTerminal(status: TaskStatus): boolean {
  return TERMINAL.includes(status);
}

export function submitVerdict(task: Task, verdict: "worth" | "not_worth"): void {
  tasksDao.setVerdict(task.id, verdict, new Date().toISOString());
}
