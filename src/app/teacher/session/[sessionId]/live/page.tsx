import LiveDashboard from "./live-dashboard";

export default async function LiveDashboardPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <LiveDashboard sessionId={sessionId} />;
}
