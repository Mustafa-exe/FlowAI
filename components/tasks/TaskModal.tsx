"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useEffect, useState } from "react";
import { Priority, Status, Task } from "@/types/task";

const priorities: Priority[] = ["High", "Medium", "Low"];
const statuses: Status[] = ["Backlog", "Pending", "In Progress", "Completed"];

type DraftTask = Omit<Task, "id"> & { id?: string };

export default function TaskModal({
  open,
  task,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = useState<DraftTask>({
    title: "",
    description: "",
    priority: "Medium",
    status: "Pending",
    dueDate: "",
    assignee: "MK",
    tags: [],
  });
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (task) {
      setDraft(task);
      return;
    }
    setDraft({
      title: "",
      description: "",
      priority: "Medium",
      status: "Pending",
      dueDate: "",
      assignee: "MK",
      tags: [],
    });
  }, [task, open]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const id = task?.id ?? Date.now().toString();
    onSave({ id, ...draft, tags: draft.tags.filter(Boolean) } as Task);
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <form
              onSubmit={submit}
              className="w-full max-w-[480px] rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl dark:border-white/10 dark:bg-[#16161a]"
            >
              <input
                autoFocus
                required
                value={draft.title}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                placeholder="Task title"
                className="w-full border-none bg-transparent text-2xl font-semibold outline-none"
              />

              <textarea
                rows={3}
                value={draft.description}
                onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                placeholder="Description"
                className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none dark:border-white/10 dark:bg-white/5"
              />

              <div className="mt-4 flex gap-2">
                {priorities.map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => setDraft((current) => ({ ...current, priority }))}
                    className={`rounded-full px-3 py-1.5 text-xs ${
                      draft.priority === priority ? "bg-[#2563eb] text-white dark:bg-[#7c6ff7]" : "bg-slate-100 dark:bg-white/10"
                    }`}
                  >
                    {priority}
                  </button>
                ))}
              </div>

              <input
                type="datetime-local"
                value={draft.dueDate}
                onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))}
                className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-white/5"
              />

              <div className="mt-4 flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setDraft((current) => ({ ...current, status }))}
                    className={`rounded-full px-3 py-1.5 text-xs ${
                      draft.status === status ? "bg-[#2563eb] text-white dark:bg-[#7c6ff7]" : "bg-slate-100 dark:bg-white/10"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <input
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && tagInput.trim()) {
                      event.preventDefault();
                      setDraft((current) => ({ ...current, tags: [...current.tags, tagInput.trim()] }));
                      setTagInput("");
                    }
                  }}
                  placeholder="Type tag and press Enter"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-white/5"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {draft.tags.map((tag, index) => (
                    <span key={`${tag}-${index}`} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-white/10">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                {task ? (
                  <button type="button" onClick={() => onDelete(task.id)} className="text-sm text-rose-500">
                    Delete Task
                  </button>
                ) : (
                  <span />
                )}
                <div className="flex gap-2">
                  <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm">
                    Cancel
                  </button>
                  <button type="submit" className="rounded-full bg-[#2563eb] px-4 py-2 text-sm font-medium text-white dark:bg-[#7c6ff7]">
                    {task ? "Save Changes" : "Create Task"}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
