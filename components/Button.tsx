"use client";

import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  brandColor?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  brandColor = "#1d4ed8",
  className = "",
  style,
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants: Record<string, string> = {
    primary: "text-white hover:opacity-90 focus:ring-blue-500",
    secondary:
      "bg-white border-2 hover:bg-gray-50 focus:ring-blue-500",
    ghost: "bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:ring-gray-400",
  };

  const sizes: Record<string, string> = {
    sm: "text-sm px-3 py-1.5",
    md: "text-base px-5 py-2.5",
    lg: "text-lg px-7 py-3",
  };

  // Compute inline style: primary gets backgroundColor from brandColor
  const computedStyle =
    variant === "primary"
      ? { backgroundColor: brandColor, ...style }
      : variant === "secondary"
      ? { borderColor: brandColor, color: brandColor, ...style }
      : style;

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      style={computedStyle}
      {...props}
    >
      {children}
    </button>
  );
}
