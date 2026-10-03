"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeReminder } from "./actions";

type CompleteReminderButtonProps = {
  userReminderId: string;
};

export function CompleteReminderButton({
  userReminderId,
}: CompleteReminderButtonProps) {
  const router = useRouter();
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState("");

  async function handleComplete() {
    setError("");
    setIsCompleting(true);

    const result = await completeReminder(userReminderId);

    if (!result.success) {
      setError(result.error);
      setIsCompleting(false);
      return;
    }

    window.dispatchEvent(new Event("reminders-updated"));
    router.refresh();
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleComplete}
        disabled={isCompleting}
        className="inline-flex items-center gap-2 rounded-xl bg-[#FFD400] px-4 py-2.5 text-sm font-bold text-[#176B7A] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        <Check className="h-4 w-4" strokeWidth={2.5} />
        {isCompleting ? "Guardando..." : "Marcar realizado"}
      </button>

      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}
