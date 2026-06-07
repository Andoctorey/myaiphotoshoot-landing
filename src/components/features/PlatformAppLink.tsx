'use client';

import type { MouseEvent, ReactNode } from 'react';
import { trackEventAndNavigate } from '@/lib/analytics';
import { usePlatformAppLink } from '@/hooks/usePlatformAppLink';

type Props = {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
};

export default function PlatformAppLink({ children, className, ariaLabel }: Props) {
  const appLink = usePlatformAppLink();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
      || event.button !== 0
    ) {
      return;
    }

    event.preventDefault();
    trackEventAndNavigate(appLink.event, appLink.url);
  };

  return (
    <a
      href={appLink.url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={ariaLabel}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
