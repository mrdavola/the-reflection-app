import Snapshot from "./snapshot";

export default async function SnapshotPage({
  params,
}: {
  params: Promise<{ reflectionId: string }>;
}) {
  const { reflectionId } = await params;
  return <Snapshot reflectionId={reflectionId} />;
}
