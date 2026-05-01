import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * The activities list lives inside the group detail page as a sub-tab so that
 * the surrounding context (group name, member count, sub-tab navigation)
 * stays visible. This route just deep-links into that tab.
 */
export default async function GroupActivitiesIndexRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/app/groups/${id}?tab=activities`);
}
