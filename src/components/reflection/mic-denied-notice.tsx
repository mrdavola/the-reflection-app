"use client";

/**
 * Recovery block shown on the prompt screen when getUserMedia rejected
 * with permission_denied. Replaces the mic button + "tap to speak" copy
 * because re-tapping won't help once the user has hard-denied access —
 * they have to flip the site-permission in their browser settings.
 *
 * Used by both /app/personal/run and /r/[shareCode]/run.
 */

export function MicDeniedNotice() {
  return (
    <div className="flex flex-col items-center gap-3 max-w-md text-center">
      <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem]">
        Microphone blocked
      </p>
      <p className="text-foreground/80 text-sm">
        Refleckt needs your microphone to capture your reflection. Allow
        microphone access for this site in your browser settings, then
        refresh this page.
      </p>
      <p className="text-foreground/50 text-xs">
        In Chrome / Edge / Safari: click the lock icon next to the URL → set
        Microphone to &ldquo;Allow.&rdquo;
      </p>
    </div>
  );
}
