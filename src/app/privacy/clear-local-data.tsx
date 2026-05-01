"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { store } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

export function ClearLocalDataButton() {
  const [open, setOpen] = useState(false);

  function handleClear() {
    store.reset();
    setOpen(false);
    toast.success("Cleared");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="h-4 w-4" />
          Clear local data
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clear all local The Reflection App data?</DialogTitle>
          <DialogDescription>
            This removes your user profile, groups, activities, participants,
            reflections, and cached summaries from this browser. It cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleClear}>
            <Trash2 className="h-4 w-4" />
            Yes, clear everything
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
