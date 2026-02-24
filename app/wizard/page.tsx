import { WizardShell } from "@/components/WizardShell";

interface WizardPageProps {
  searchParams: { agency?: string };
}

export default function WizardPage({ searchParams }: WizardPageProps) {
  const agency = searchParams.agency ?? undefined;
  return <WizardShell agency={agency} />;
}
