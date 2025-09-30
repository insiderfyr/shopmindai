import { TooltipAnchor, Button } from '~/components/ui';
import { useLocalize } from '~/hooks';

export default function OpenSidebar({
  setNavVisible,
}: {
  setNavVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const localize = useLocalize();
  return (
    <TooltipAnchor
      description={localize('com_nav_open_sidebar')}
      render={
        <Button
          size="icon"
          variant="outline"
          data-testid="open-sidebar-button"
          aria-label={localize('com_nav_open_sidebar')}
          className="rounded-xl border border-border-light bg-surface-secondary p-2 hover:bg-surface-hover max-md:hidden"
          onClick={() =>
            setNavVisible((prev) => {
              localStorage.setItem('navVisible', JSON.stringify(!prev));
              return !prev;
            })
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5 text-slate-700 dark:text-white"
          >
            <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="9" y1="4" x2="9" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Button>
      }
    />
  );
}
