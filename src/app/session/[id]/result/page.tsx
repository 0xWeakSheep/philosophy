import { ResultExperience } from "@/components/result/result-experience";

interface ResultPageProps {
  params: Promise<{ id: string }>;
}

export default async function ResultPage({ params }: ResultPageProps) {
  const { id } = await params;
  return <ResultExperience sessionId={id} />;
}
