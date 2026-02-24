"use client";

interface ProgressBarProps {
  current: number;
  total: number;
  brandColor?: string;
}

export function ProgressBar({
  current,
  total,
  brandColor = "#1d4ed8",
}: ProgressBarProps) {
  const percent = Math.round((current / total) * 100);

  return (
    <div className="w-full" role="progressbar" aria-valuenow={current} aria-valuemax={total}>
      <div className="flex justify-between text-xs text-gray-400 mb-1.5 font-medium">
        <span>
          Paso {current} de {total}
        </span>
        <span>{percent}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percent}%`, backgroundColor: brandColor }}
        />
      </div>
    </div>
  );
}
