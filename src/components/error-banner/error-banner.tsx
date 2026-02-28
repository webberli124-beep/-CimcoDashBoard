import { AlertTriangle, X } from "lucide-react";
import type { ApiErrorDetail } from "@/services/api";

interface ErrorBannerProps {
  error: ApiErrorDetail;
  onDismiss: () => void;
}

export function ErrorBanner({ error, onDismiss }: ErrorBannerProps) {
  return (
    <div className="bg-red-950 border border-red-500 rounded-lg px-4 py-3 mx-4 mb-2 flex items-start gap-3">
      <AlertTriangle
        size={20}
        className="text-red-300 shrink-0 mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <div className="text-red-300 font-semibold text-sm leading-5">
          {error.message}
        </div>
        {error.suggestion && (
          <div className="text-red-300/80 text-xs leading-[18px] mt-1">
            {error.suggestion}
          </div>
        )}
        <div className="text-red-300/50 text-[11px] mt-1 font-mono">
          {error.code}
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="bg-transparent border-none cursor-pointer p-1 text-red-300/70 shrink-0 hover:text-red-300 transition-colors"
        aria-label="Dismiss error"
      >
        <X size={16} />
      </button>
    </div>
  );
}
