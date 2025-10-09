import type { InputHTMLAttributes, ReactNode } from "react";

export type FormFieldProps = {
  label: string;
  error?: string | null;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  onRightIconClick?: () => void;
  rightIconAriaLabel?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function FormField({
  label,
  id,
  name,
  error,
  iconLeft,
  iconRight,
  onRightIconClick,
  rightIconAriaLabel,
  className,
  ...props
}: FormFieldProps) {
  const inputId = id ?? name;
  const paddingLeft = iconLeft ? "pl-10" : "pl-4";
  const paddingRight = iconRight ? "pr-10" : "pr-4";

  return (
    <div className={className}>
      <label htmlFor={inputId} className="text-sm text-gray-500 mb-1 block">
        {label}
      </label>
      <div className="relative">
        {iconLeft ? (
          <span className="absolute left-3 inset-y-0 flex items-center text-gray-400">
            {iconLeft}
          </span>
        ) : null}
        <input
          id={inputId}
          name={name}
          className={`w-full h-12 bg-gray-100 rounded-xl border border-transparent focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)] focus:ring-offset-2 focus:ring-offset-white text-sm text-[color:var(--ink)] placeholder:text-gray-400 ${paddingLeft} ${paddingRight}`}
          aria-invalid={error ? "true" : "false"}
          {...props}
        />
        {iconRight ? (
          <button
            type="button"
            onClick={onRightIconClick}
            className="absolute right-3 inset-y-0 flex items-center text-gray-400 focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)] rounded-full"
            aria-label={rightIconAriaLabel}
          >
            {iconRight}
          </button>
        ) : null}
      </div>
      {error ? <p className="text-xs text-red-600 mt-1">{error}</p> : null}
    </div>
  );
}
