import StudentRoutine from "./student-routine";

export default async function StudentSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <StudentRoutine sessionId={sessionId} />;
}
