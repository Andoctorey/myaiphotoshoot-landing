'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const spinnerVariants = cva(
  'animate-spin rounded-full border-solid border-t-transparent',
  {
    variants: {
      size: {
        sm: 'h-4 w-4 border-2',
        md: 'h-8 w-8 border-2',
        lg: 'h-12 w-12 border-4',
      },
      variant: {
        primary: 'border-purple-600 border-t-transparent',
        white: 'border-white border-t-transparent',
        gray: 'border-gray-300 dark:border-gray-600 border-t-transparent',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'primary',
    },
  }
);

interface LoadingSpinnerProps extends VariantProps<typeof spinnerVariants> {
  className?: string;
  fullScreen?: boolean;
  label?: string;
}

export function LoadingSpinner({
  size,
  variant,
  className,
  fullScreen = false,
  label = 'Loading...',
}: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={cn(spinnerVariants({ size, variant }), className)}
      aria-label={label}
      role="status"
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-50">
        <div className="flex flex-col items-center gap-2">
          {spinner}
          {label && <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-2">
        {spinner}
        {label && <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>}
      </div>
    </div>
  );
}

export function LoadingOverlay({
  size,
  variant,
  className,
  label = 'Loading...',
}: LoadingSpinnerProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-10 rounded-lg">
      <div className="flex flex-col items-center gap-2">
        <div
          className={cn(spinnerVariants({ size, variant }), className)}
          aria-label={label}
          role="status"
        />
        {label && <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>}
      </div>
    </div>
  );
}

export function ButtonSpinner({
  size = 'sm',
  variant = 'white',
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(spinnerVariants({ size, variant }), className)}
      aria-hidden="true"
    />
  );
} 