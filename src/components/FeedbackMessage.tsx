import { ReactNode } from "react";

import { Icon, type IconName } from "./Icon";

type FeedbackMessageProps = {
  variant: "error" | "success";
  message: string;
  action?: ReactNode;
};

const variantStyles: Record<FeedbackMessageProps["variant"], string> = {
  error: "bg-red-50 border-red-200 text-red-700",
  success: "bg-emerald-50 border-emerald-200 text-emerald-700",
};

const variantIcons: Record<FeedbackMessageProps["variant"], IconName> = {
  error: "alert-circle",
  success: "check-circle",
};

const variantRole: Record<FeedbackMessageProps["variant"], "alert" | "status"> = {
  error: "alert",
  success: "status",
};

export function FeedbackMessage({ variant, message, action }: FeedbackMessageProps) {
  return (
    <div
      role={variantRole[variant]}
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${variantStyles[variant]}`}
    >
      <Icon name={variantIcons[variant]} className="mt-0.5 h-5 w-5 flex-shrink-0" />
      <div className="flex-1">
        <p>{message}</p>
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    </div>
  );
}
