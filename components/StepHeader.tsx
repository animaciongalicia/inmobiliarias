"use client";

interface StepHeaderProps {
  title: string;
  subtitle?: string;
}

export function StepHeader({ title, subtitle }: StepHeaderProps) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-bold text-gray-900 leading-snug">{title}</h2>
      {subtitle && (
        <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
