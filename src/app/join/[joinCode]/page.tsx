import JoinForm from "./join-form";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ joinCode: string }>;
}) {
  const { joinCode } = await params;
  return <JoinForm initialJoinCode={joinCode} />;
}
