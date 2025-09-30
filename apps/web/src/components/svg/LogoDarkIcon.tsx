import { cn } from '~/utils';

export default function LogoDarkIcon({ size = 24, className = '' }) {
  return (
    <img
      src="/assets/logo-dark.svg"
      alt="Shopmind AI Logo"
      width={size}
      height={size}
      className={cn(className)}
    />
  );
}
