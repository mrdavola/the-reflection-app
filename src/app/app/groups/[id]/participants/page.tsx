import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * The participants list lives inside the group detail page as a sub-tab.
 * This route just deep-links into that tab.
 */
export default async function GroupParticipantsIndexRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/app/groups/${id}?tab=participants`);
}
