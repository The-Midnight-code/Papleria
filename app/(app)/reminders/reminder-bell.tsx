"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

import { getPendingReminderCount } from "./actions";

export function ReminderBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadCount() {
      const pendingCount = await getPendingReminderCount();

      if (isMounted) {
        setCount(pendingCount);
      }
    }

    loadCount();

    window.addEventListener("reminders-updated", loadCount);

    const interval = window.setInterval(loadCount, 30_000);

    return () => {
      isMounted = false;
      window.removeEventListener("reminders-updated", loadCount);
      window.clearInterval(interval);
    };
  }, []);

  return (
    <Link
      href="/reminders"
      title="Recordatorios"
      aria-label={
        count > 0 ? `${count} recordatorios pendientes` : "Recordatorios"
      }
      className="relative flex h-10 w-10 items-center justify-center rounded-xl text-white/70 transition hover:bg-white/10 hover:text-[#FFD400]"
    >
      <Bell className="h-5 w-5" />

      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#F76400] px-1 text-[10px] font-bold leading-none text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
