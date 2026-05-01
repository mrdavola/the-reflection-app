import { redirect } from "next/navigation";

// Phase 2C: the standalone Live page is folded into the dashboard's Live tab.
export default function LiveRedirectPage(): never {
  redirect("/app?tab=live");
}
