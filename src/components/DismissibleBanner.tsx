import { X } from 'lucide-react';

interface DismissibleBannerProps {
  /** Message to display. */
  message: string;
  /** Called when the user dismisses the banner. */
  onDismiss: () => void;
}

/**
 * Small inline error banner with a dismiss button.
 * Used for the optional AI calls, whose failures must never block the
 * core (offline) flow — the user can always dismiss and continue.
 */
export function DismissibleBanner({ message, onDismiss }: DismissibleBannerProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-2">
      <p className="text-xs text-red-400">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-gray-500 hover:text-gray-300 ml-2"
      >
        <X size={13} />
      </button>
    </div>
  );
}
