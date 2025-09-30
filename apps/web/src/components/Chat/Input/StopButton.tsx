import { TooltipAnchor } from '~/components/ui';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';

export default function StopButton({ stop, setShowStopButton, setShowStopAdded }) {
  const localize = useLocalize();

  return (
    <TooltipAnchor
      description={localize('com_nav_stop_generating')}
      render={
        <button
          type="button"
          className={cn(
            'rounded-full bg-gradient-to-r from-red-500 to-red-600 p-1.5 text-white shadow-lg shadow-red-500/25 outline-offset-4 transition-all duration-300 ease-in-out hover:scale-105 hover:from-red-600 hover:to-red-700 hover:shadow-xl hover:shadow-red-500/40 focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:text-text-secondary disabled:opacity-50',
          )}
          aria-label={localize('com_nav_stop_generating')}
          onClick={(e) => {
            setShowStopButton(false);
            if (setShowStopAdded) {
              setShowStopAdded(false);
            }
            stop(e);
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="icon-lg text-surface-primary"
          >
            <rect x="7" y="7" width="10" height="10" rx="1.25" fill="currentColor"></rect>
          </svg>
        </button>
      }
    ></TooltipAnchor>
  );
}
