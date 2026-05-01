"use client";

export const dynamic = "force-dynamic";

/**
 * Calm thank-you after a share-link reflection.
 *
 * Single serif statement, optional CTA back to the entry screen. No analysis
 * card, no recharge cards — the reflection is done; the door closes quietly.
 */

import { Suspense, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useStore } from "@/lib/storage";

interface Props {
  params: Promise<{ shareCode: string }>;
}

export default function ShareDonePage(props: Props) {
  return (
    <Suspense fallback={null}>
      <ShareDonePageInner {...props} />
    </Suspense>
  );
}

function ShareDonePageInner({ params }: Props) {
  const { shareCode } = use(params);
  const searchParams = useSearchParams();
  const reflectionId = searchParams.get("reflectionId") ?? "";

  const reflection = useStore((s) =>
    s.reflections.find((r) => r.id === reflectionId),
  );

  const firstName =
    reflection?.participantName && reflection.participantName !== "Anonymous"
      ? reflection.participantName.split(" ")[0]
      : "";

  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col items-center justify-center gap-8 px-6 text-center"
      >
        <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem]">
          Reflection submitted
        </p>

        <h1 className="font-display text-[2.75rem] md:text-[3.75rem] leading-[1.05] tracking-[-0.02em]">
          Thank you{firstName ? `, ${firstName}` : ""}.
        </h1>

        <p className="text-[1rem] md:text-[1.125rem] leading-[1.55] text-foreground/70 max-w-md">
          Your teacher will see this in their next class summary. You can close
          this tab whenever you&rsquo;re ready.
        </p>

        <span
          aria-hidden
          className="block h-1.5 w-1.5 rounded-full bg-primary/30 mt-4"
        />

        <Link
          href={`/r/${shareCode}`}
          className="inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.3em] text-foreground/40 hover:text-foreground transition-colors"
        >
          Reflect again later
          <ArrowRight className="h-3 w-3" />
        </Link>
      </motion.div>
    </div>
  );
}
