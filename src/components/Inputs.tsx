import type { InputHTMLAttributes } from "react";
type Props = InputHTMLAttributes<HTMLInputElement> & { label: string };
export function CompleteInput({ label, id, className = "", ...props }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        className={`min-h-12 w-full rounded-xl border border-input-line bg-panel px-4 py-3 text-sm text-ink outline-offset-4 placeholder:text-subtle focus-visible:outline-2 ${className}`}
        {...props}
      />
    </div>
  );
}
