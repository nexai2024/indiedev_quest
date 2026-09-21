"use client";

import { screenGuideFor } from "@/lib/content/screen-guides";
import { CircleHelp } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function ScreenGuide() {
  const pathname = usePathname();
  const guide = screenGuideFor(pathname);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(Boolean(guide?.defaultOpen));
  }, [pathname, guide?.defaultOpen]);

  if (!guide) return null;

  return (
    <div className="border-b border-yellow-500/20 bg-neutral-950/95">
      <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-2.5">
        <CircleHelp className="mt-0.5 size-4 shrink-0 text-yellow-400" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="font-game text-lg leading-none text-yellow-400">{guide.title}</p>
            <button
              type="button"
              className="text-[11px] font-mono uppercase tracking-wide text-gray-400 hover:text-yellow-300"
              onClick={() => setOpen((value) => !value)}
            >
              {open ? "Hide steps" : "How this screen works"}
            </button>
            <Link href="/settings" className="text-[11px] font-mono uppercase tracking-wide text-amber-300 hover:text-yellow-200">
              How to level up
            </Link>
          </div>
          <p className="mt-1 text-xs font-mono text-gray-300">{guide.blurb}</p>
          {open && (
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs font-mono text-gray-200">
              {guide.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
