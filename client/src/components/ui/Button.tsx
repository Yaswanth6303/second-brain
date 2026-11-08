import type { ButtonHTMLAttributes } from "react";

const VARIANTS = {
  primary: "bg-brand text-brand-ink border-brand hover:bg-brand-strong hover:border-brand-strong",
  outline: "bg-transparent text-ink border-line hover:bg-surface-2",
  "outline-primary": "bg-transparent text-brand border-brand hover:bg-brand hover:text-brand-ink",
  danger: "bg-danger text-surface border-danger hover:opacity-90",
};

const SIZES = {
  sm: "px-2 py-1 text-[0.875rem] rounded-[0.5rem]",
  md: "px-3 py-1.5 rounded-[0.6rem]",
  lg: "px-4 py-2 text-[1.25rem] rounded-[0.9rem]",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-1.5 border font-semibold transition-colors disabled:pointer-events-none disabled:opacity-65 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    />
  );
}
