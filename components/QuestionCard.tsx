"use client";

interface Option {
  label: string;
  value: string;
}

interface QuestionCardProps {
  options: (Option | string)[];
  selected?: string;
  onSelect: (value: string) => void;
  brandColor?: string;
}

export function QuestionCard({
  options,
  selected,
  onSelect,
  brandColor = "#1d4ed8",
}: QuestionCardProps) {
  const normalized: Option[] = options.map((opt) =>
    typeof opt === "string" ? { label: opt, value: opt } : opt
  );

  return (
    <div className="grid gap-2.5">
      {normalized.map(({ label, value }) => {
        const isSelected = selected === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            className={`text-left px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
              isSelected
                ? "text-white border-transparent shadow-sm"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
            }`}
            style={
              isSelected
                ? { backgroundColor: brandColor, borderColor: brandColor }
                : undefined
            }
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
