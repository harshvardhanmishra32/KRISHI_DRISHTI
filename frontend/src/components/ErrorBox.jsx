import React from "react";
import { AlertCircle, RotateCcw, X } from "lucide-react";
import Button from "./Button";

export default function ErrorBox({
  message,
  error,
  onDismiss,
  onRetry,
  className = "",
}) {
  const displayMessage =
    (typeof error === "string" ? error : error?.message) ||
    message ||
    "An error occurred. Please try again.";

  return (
    <div
      className={`bg-red-50 border border-red-200 rounded-card p-4 text-center space-y-3 ${className}`}
      role="alert"
    >
      <div className="flex items-center justify-between gap-2 text-krishi-red font-medium text-sm">
        <div className="flex items-center gap-2 text-left">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="leading-snug">{displayMessage}</span>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors flex-shrink-0"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {onRetry && (
        <div className="max-w-[140px] mx-auto pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            icon={RotateCcw}
            className="!h-9 text-xs !border-krishi-red !text-krishi-red hover:!bg-red-50"
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
