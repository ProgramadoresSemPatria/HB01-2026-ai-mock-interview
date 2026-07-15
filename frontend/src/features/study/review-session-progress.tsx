import type { ReviewSessionStreamMetaProgress } from "@/types/review-sessions";

type ReviewSessionProgressFields = Pick<
  ReviewSessionStreamMetaProgress,
  "itemIndex" | "totalItems" | "turnsCompleted" | "questionsPerItem"
>;

export type ReviewSessionProgressProps = {
  meta?: ReviewSessionStreamMetaProgress | null;
} & Partial<ReviewSessionProgressFields>;

function resolveProgress(
  props: ReviewSessionProgressProps,
): ReviewSessionProgressFields | null {
  if (props.meta) {
    return props.meta;
  }

  const { itemIndex, totalItems, turnsCompleted, questionsPerItem } = props;

  if (
    itemIndex === undefined ||
    totalItems === undefined ||
    turnsCompleted === undefined ||
    questionsPerItem === undefined
  ) {
    return null;
  }

  return { itemIndex, totalItems, turnsCompleted, questionsPerItem };
}

export function ReviewSessionProgress(props: ReviewSessionProgressProps) {
  const progress = resolveProgress(props);

  if (!progress) {
    return null;
  }

  const { itemIndex, totalItems, turnsCompleted, questionsPerItem } = progress;

  return (
    <p className="text-xs text-text-base">
      Topic {itemIndex + 1}/{totalItems} — Question {turnsCompleted + 1}/
      {questionsPerItem}
    </p>
  );
}
