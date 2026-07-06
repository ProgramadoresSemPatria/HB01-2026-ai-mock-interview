import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";

type TopicStatusCardProps = {
  title: string;
  status: string;
  tone: "critical" | "good" | "neutral";
  monochrome?: boolean;
};

function TopicStatusCard({
  title,
  status,
  tone,
  monochrome = false,
}: TopicStatusCardProps) {
  const badgeTone = monochrome
    ? "neutral"
    : tone === "critical"
      ? "critical"
      : tone === "good"
        ? "success"
        : "neutral";

  return (
    <Surface
      variant="default"
      padding="md"
      radius="lg"
      className="h-full border-white/10 bg-white/5"
    >
      <p className="text-sm font-semibold tracking-[-0.02em] text-text-strong">
        {title}
      </p>
      <Badge tone={badgeTone} className="mt-4">
        {status}
      </Badge>
    </Surface>
  );
}

export type { TopicStatusCardProps };
export { TopicStatusCard };
