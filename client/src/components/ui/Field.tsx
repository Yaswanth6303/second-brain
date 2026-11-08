import { type InputHTMLAttributes, type ReactNode, useId } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
  prefix?: string;
  suffix?: ReactNode;
  labelEnd?: ReactNode;
};

// Label + input (+ optional "@" prefix or trailing button) + error or hint, like the prototype's input-group.
export function Field({
  label,
  error,
  hint,
  prefix,
  suffix,
  labelEnd,
  className = "",
  ...input
}: Props) {
  const id = useId();
  const msgId = `${id}-msg`;
  const joined = prefix || suffix;
  return (
    <div className={className}>
      <div className="flex justify-between">
        <label className="label" htmlFor={id}>
          {label}
        </label>
        {labelEnd}
      </div>
      <div className="flex">
        {prefix && (
          <span className="bg-surface-2 border-line text-muted flex items-center rounded-l-[0.6rem] border border-r-0 px-3">
            {prefix}
          </span>
        )}
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? msgId : undefined}
          className={`field ${error ? "field-invalid" : ""} ${joined ? "min-w-0 flex-1" : ""} ${prefix ? "rounded-l-none" : ""} ${suffix ? "rounded-r-none" : ""}`}
          {...input}
        />
        {suffix}
      </div>
      {error ? (
        <div id={msgId} className="text-danger mt-1 text-[0.875em]">
          {error}
        </div>
      ) : (
        hint && (
          <div id={msgId} className="text-muted mt-1 text-[0.875em]">
            {hint}
          </div>
        )
      )}
    </div>
  );
}
