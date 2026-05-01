"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Mail, ShieldAlert, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { store, useStore } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { VoicePersonaSettings } from "@/components/reflection";

const APP_VERSION = "0.1.0";
const NO_LOGIN_KEY = "refleckt:settings:no-login-default";

export default function SettingsPage() {
  const user = useStore((s) => s.user);
  const reflections = useStore((s) => s.reflections);
  const groups = useStore((s) => s.groups);
  const activities = useStore((s) => s.activities);
  const [name, setName] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [noLoginDefault, setNoLoginDefault] = useState(true);

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(NO_LOGIN_KEY);
      // Default ON when unset — privacy-first for under-14.
      setNoLoginDefault(stored === null ? true : stored === "1");
    } catch {
      // ignore
    }
  }, []);

  function saveName() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Name can't be empty");
      return;
    }
    store.updateUser({ name: trimmed });
    toast.success("Display name updated");
  }

  function handleReset() {
    store.reset();
    setResetOpen(false);
    toast.success("Local data cleared");
  }

  function toggleNoLogin(next: boolean) {
    setNoLoginDefault(next);
    try {
      window.localStorage.setItem(NO_LOGIN_KEY, next ? "1" : "0");
    } catch {
      // ignore
    }
  }

  function exportData() {
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        appVersion: APP_VERSION,
        user,
        groups,
        activities,
        reflections,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `refleckt-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't build the export.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <header className="space-y-3">
        <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem]">
          No.&nbsp;03 — Settings
        </p>
        <h1 className="font-display text-[clamp(2.25rem,4.5vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.02em]">
          Tune the room.
        </h1>
        <p className="prose-measure text-foreground/70">
          Manage your profile, voice persona, and how data lives on this device.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-xl">
            <UserRound className="h-4 w-4 text-primary" />
            Profile
          </CardTitle>
          <CardDescription>
            Your display name appears on personal reflections and group cards.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display-name">Display name</Label>
            <div className="flex gap-2">
              <Input
                id="display-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={user?.name ?? "Your name"}
                className="flex-1"
              />
              <Button
                onClick={saveName}
                disabled={!user || name.trim() === (user?.name ?? "")}
              >
                Save
              </Button>
            </div>
            {!user && (
              <p className="text-xs text-muted-foreground">
                Profile loads from local storage. Open the dashboard once to
                initialize it.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Voice persona</CardTitle>
          <CardDescription>
            Pick a voice for the personal reflection coach. Off by default;
            never used in group activities or classroom mode.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VoicePersonaSettings />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Privacy &amp; data</CardTitle>
          <CardDescription>
            Everything on this device, under your control.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Label className="font-display text-base">
                No-login mode by default for under-14
              </Label>
              <p className="text-xs leading-relaxed text-muted-foreground">
                When on, learners under 14 join with a name and a code — no
                account, no email. Recommended.
              </p>
            </div>
            <Switch
              checked={noLoginDefault}
              onCheckedChange={toggleNoLogin}
              aria-label="No-login mode by default for under-14"
            />
          </div>

          <hr className="rule-soft" />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="font-display text-base text-foreground">
                Export your data
              </p>
              <p className="text-xs text-muted-foreground">
                Download a JSON snapshot of profile, groups, activities, and
                reflections from this browser.
              </p>
            </div>
            <Button variant="outline" onClick={exportData}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

          <hr className="rule-soft" />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="font-display text-base text-foreground">
                Reset all local data
              </p>
              <p className="text-xs text-muted-foreground">
                Clears profile, groups, activities, participants, reflections,
                and cached summaries from this browser. There is no undo.
              </p>
            </div>
            <Dialog open={resetOpen} onOpenChange={setResetOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4" />
                  Reset
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display text-xl">
                    Reset all local data?
                  </DialogTitle>
                  <DialogDescription>
                    This will clear your profile, groups, activities,
                    participants, reflections, and any cached summaries from
                    this browser. There is no undo.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button variant="destructive" onClick={handleReset}>
                    <Trash2 className="h-4 w-4" />
                    Yes, reset everything
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">About</CardTitle>
          <CardDescription>For the curious and the careful.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <AboutRow label="Version" value={`v${APP_VERSION}`} mono />
          <AboutRow
            label="Privacy"
            value={
              <Link
                href="/privacy"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                Read the privacy note
              </Link>
            }
          />
          <AboutRow
            label="Contact"
            value={
              <a
                href="mailto:emailmrdavola@gmail.com"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <Mail className="h-3.5 w-3.5" />
                emailmrdavola@gmail.com
              </a>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

function AboutRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-2 last:border-b-0">
      <span className="margin-note uppercase tracking-[0.3em] text-[0.65rem]">
        {label}
      </span>
      <span
        className={
          mono
            ? "font-mono text-sm text-foreground/85"
            : "text-sm text-foreground/85"
        }
      >
        {value}
      </span>
    </div>
  );
}
