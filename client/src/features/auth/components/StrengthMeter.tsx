import { passwordStrength } from "../lib/strength.ts";

export function StrengthMeter({ password }: { password: string }) {
  const { score, hint } = passwordStrength(password);
  return (
    <>
      <div
        role="progressbar"
        aria-label="Password strength"
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={score}
        className="bg-surface-2 mt-2 h-1.5 overflow-hidden rounded-full"
      >
        <div className="bg-brand h-full transition-[width]" style={{ width: `${score * 25}%` }} />
      </div>
      <div className="text-muted mt-1 text-[0.875em]">{hint}</div>
    </>
  );
}
