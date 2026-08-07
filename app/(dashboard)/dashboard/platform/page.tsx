import {
  PROGRESS_MILESTONES,
  PROGRESS_UPDATED_AT,
  CURRENT_FUNCTIONALITY,
  type ProgressMilestone,
  type TaskState,
} from "@/lib/progress";

export const dynamic = "force-dynamic";

const TASK_STATE_LABELS: Record<TaskState, string> = {
  done: "Finalizat",
  in_progress: "În lucru",
  planned: "Planificat",
};

const TASK_STATE_STYLES: Record<TaskState, string> = {
  done: "bg-emerald-100 text-emerald-700",
  in_progress: "bg-amber-100 text-amber-700",
  planned: "bg-neutral-100 text-neutral-600",
};

function milestoneState(milestone: ProgressMilestone): TaskState {
  const states = milestone.tasks.map((t) => t.state);
  if (states.every((s) => s === "done")) return "done";
  if (states.some((s) => s === "done" || s === "in_progress")) return "in_progress";
  return "planned";
}

export default function PlatformStatusPage() {
  return (
    <div className="max-w-3xl">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Progress Platformă
        </h1>
        <p className="text-xs text-neutral-500">
          Actualizat {new Date(PROGRESS_UPDATED_AT).toLocaleDateString("ro-RO", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>
      <p className="mt-2 text-sm text-neutral-600">
        Stadiul dezvoltării SuntCastigator, pe etape. Vizibil doar contului
        echipei.
      </p>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-neutral-900">
          Progres pe etape
        </h2>
        <div className="mt-3 space-y-3">
          {PROGRESS_MILESTONES.map((milestone) => {
            const state = milestoneState(milestone);
            return (
              <details
                key={milestone.id}
                className="group rounded-lg border border-neutral-200 bg-white"
                open={state !== "done"}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="shrink-0 text-xs font-medium uppercase tracking-wider text-neutral-500">
                      {milestone.id}
                    </span>
                    <span className="truncate text-sm font-semibold text-neutral-900">
                      {milestone.title}
                    </span>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${TASK_STATE_STYLES[state]}`}
                  >
                    {TASK_STATE_LABELS[state]}
                  </span>
                </summary>
                <ul className="space-y-1.5 border-t border-neutral-100 px-5 py-4">
                  {milestone.tasks.map((task) => (
                    <li
                      key={task.id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="min-w-0 truncate text-neutral-700">
                        <span className="text-neutral-400">{task.id}</span>{" "}
                        {task.title}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${TASK_STATE_STYLES[task.state]}`}
                      >
                        {TASK_STATE_LABELS[task.state]}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-neutral-900">
          Ce funcționează acum
        </h2>
        <ul className="mt-3 space-y-2 rounded-lg border border-neutral-200 bg-white p-5">
          {CURRENT_FUNCTIONALITY.map((item) => (
            <li key={item} className="flex gap-2.5 text-sm text-neutral-700">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
