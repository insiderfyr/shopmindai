import { cn } from '~/utils';

export default function LogoIcon({ size = 24, className = '' }) {
  return (
    <img
      src="/assets/logo.svg"
      alt="Shopmind AI Logo"
      width={size}
      height={size}
      className={cn(className)}
    />
  );
}