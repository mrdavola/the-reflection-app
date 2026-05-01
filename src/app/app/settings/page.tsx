"use client";

import { useEffect, useState } from "react";
import { Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { store, useStore } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function SettingsPage() {
  const user = useStore((s) => s.user);
  const [name, setName] = useState("");
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

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

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-3xl tracking-tight md:text-4xl">Settings</h1>
        <p className="mt-2 text-foreground/75">
          Manage your profile and local data on this device.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-muted-foreground" />
            Profile
          </CardTitle>
          <CardDescription>
            Your display name appears on personal reflections and group cards.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
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
                Profile loads from local storage. Try opening the dashboard once
                to initialize it.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>
            Reset removes all local The Reflection App data on this browser — user,
            groups, activities, participants, reflections, and cached summaries.
            It can&apos;t be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Dialog open={resetOpen} onOpenChange={setResetOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4" />
                Reset all local data
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset all local The Reflection App data?</DialogTitle>
                <DialogDescription>
                  This will clear your profile, groups, activities,
                  participants, reflections, and any cached summaries from this
                  browser. There is no undo.
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
        </CardContent>
      </Card>
    </div>
  );
}
