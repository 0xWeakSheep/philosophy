import { SessionExperience } from "@/components/session/session-experience";

interface SessionPageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionPage({ params }: SessionPageProps) {
  const { id } = await params;
  return <SessionExperience sessionId={id} />;
}
