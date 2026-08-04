"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddTaskForm, type ExistingTask } from "@/components/dashboard/add-task-form";
import { Plus, CheckSquare, Square, Bot, Pencil, Trash2 } from "lucide-react";

type Task = {
  id: string;
  title: string;
  due_at: string | null;
  status: string;
  priority: ExistingTask["priority"];
  source: string;
  customer_id: string | null;
  customers: { full_name: string } | null;
};

const PRIORITY_TONE: Record<string, "success" | "pending" | "attention" | "info" | "neutral"> = {
  low: "neutral",
  normal: "info",
  high: "attention",
};

function formatDue(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  const overdue = d.getTime() < Date.now();
  return {
    text: d.toLocaleString("en-SG", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    }),
    overdue,
  };
}

function toExisting(t: Task): ExistingTask {
  return {
    id: t.id,
    title: t.title,
    due_at: t.due_at,
    priority: t.priority,
    customer_id: t.customer_id,
  };
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("tasks")
      .select("id, title, due_at, status, priority, source, customer_id, customers(full_name)")
      .order("due_at", { ascending: true, nullsFirst: false });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setErrorMsg(null);
      setTasks((data as unknown as Task[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, []);

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    load();
  }

  async function toggleDone(id: string, currentStatus: string) {
    const supabase = createClient();
    await supabase
      .from("tasks")
      .update({ status: currentStatus === "open" ? "done" : "open" })
      .eq("id", id);
    load();
  }

  async function handleDelete(t: Task) {
    if (!confirm(`Delete "${t.title}"? This can't be undone.`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("tasks").delete().eq("id", t.id);
    if (error) {
      alert(`Couldn't delete: ${error.message}`);
      return;
    }
    load();
  }

  const open = tasks.filter((t) => t.status === "open");
  const done = tasks.filter((t) => t.status === "done");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Tasks</h1>
          <p className="text-sm text-ink-soft">
            Manual tasks now — agent-generated reminders will land here too
            once the agent layer is live.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setShowForm((s) => !s);
          }}
        >
          <Plus size={16} />
          New task
        </Button>
      </div>

      {(showForm || editing) && (
        <AddTaskForm existing={editing ? toExisting(editing) : undefined} onClose={closeForm} />
      )}

      {errorMsg && (
        <Card className="border-attention/30 bg-attention/5 p-4 text-sm text-attention">
          Couldn&apos;t load tasks: {errorMsg}.
        </Card>
      )}

      {!loading && !errorMsg && tasks.length === 0 && (
        <Card className="flex flex-col items-center justify-center gap-2 p-12 text-center">
          <CheckSquare className="text-ink-soft" size={28} />
          <p className="text-sm font-medium text-ink">Nothing on your list</p>
          <p className="max-w-sm text-sm text-ink-soft">
            Add a task to track a follow-up, a document to chase, or a
            reminder for yourself.
          </p>
        </Card>
      )}

      {open.length > 0 && (
        <Card className="overflow-hidden">
          {open.map((t) => {
            const due = formatDue(t.due_at);
            return (
              <div
                key={t.id}
                className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-0"
              >
                <button
                  onClick={() => toggleDone(t.id, t.status)}
                  className="mt-0.5 text-ink-soft hover:text-brass-dark"
                  aria-label="Mark done"
                >
                  <Square size={18} />
                </button>
                <div className="flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge tone={PRIORITY_TONE[t.priority] ?? "neutral"}>
                      {t.priority}
                    </Badge>
                    {t.source === "agent" && (
                      <Badge tone="info">
                        <Bot size={11} className="mr-1 inline" />
                        agent
                      </Badge>
                    )}
                    {due && (
                      <span
                        className={`text-xs ${due.overdue ? "font-medium text-attention" : "text-ink-soft"}`}
                      >
                        Due {due.text}
                        {due.overdue && " · overdue"}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-ink">{t.title}</p>
                  {t.customers?.full_name && (
                    <p className="text-xs text-ink-soft">{t.customers.full_name}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditing(t);
                    }}
                    className="rounded p-1.5 text-ink-soft hover:bg-background hover:text-ink"
                    aria-label={`Edit ${t.title}`}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(t)}
                    className="rounded p-1.5 text-ink-soft hover:bg-attention/10 hover:text-attention"
                    aria-label={`Delete ${t.title}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {done.length > 0 && (
        <Card className="overflow-hidden opacity-60">
          <div className="border-b border-border bg-background px-4 py-2 text-xs font-medium uppercase text-ink-soft">
            Done
          </div>
          {done.map((t) => (
            <div
              key={t.id}
              className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-0"
            >
              <button
                onClick={() => toggleDone(t.id, t.status)}
                className="mt-0.5 text-success"
                aria-label="Mark open"
              >
                <CheckSquare size={18} />
              </button>
              <p className="flex-1 text-sm text-ink line-through">{t.title}</p>
              <button
                onClick={() => handleDelete(t)}
                className="rounded p-1.5 text-ink-soft hover:bg-attention/10 hover:text-attention"
                aria-label={`Delete ${t.title}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
