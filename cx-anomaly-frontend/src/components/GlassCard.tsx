import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '../lib/utils';

type GlassCardVariant = 'default' | 'elevated' | 'flat';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: GlassCardVariant;
  noise?: boolean;
  children: React.ReactNode;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    { className, variant = 'default', noise = false, children, ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'group relative overflow-hidden rounded-xl',
          'transition-all duration-300 ease-out',
          // iOS 26 glass base
          '@supports (backdrop-filter: blur(20px)) or (-webkit-backdrop-filter: blur(20px))',
          {
            default: 'shadow-[0_8px_32px_var(--glass-shadow)] backdrop-blur-xl [-webkit-backdrop-filter:blur(20px)]',
            elevated: 'shadow-[0_16px_48px_var(--glass-shadow)] backdrop-blur-2xl [-webkit-backdrop-filter:blur(40px)]',
            flat: 'shadow-[0_4px_16px_var(--glass-shadow)] backdrop-blur-lg [-webkit-backdrop-filter:blur(16px)]',
          }[variant],
          className
        )}
        {...props}
      >
        {/* Refraction gradient overlay */}
        <div
          className={cn(
            'pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300',
            'bg-(--glass-refraction)',
            'group-hover:opacity-100'
          )}
          aria-hidden="true"
        />

        {/* Optional noise texture */}
        {noise && (
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.15]"
            aria-hidden="true"
          >
            <filter id="noise">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.8"
                numOctaves="4"
                stitchTiles="stitch"
              />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#noise)" />
          </svg>
        )}

        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

export default GlassCard;
export { GlassCard };