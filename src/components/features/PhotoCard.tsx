'use client';

import Image from 'next/image';
import Link from 'next/link';
import PromptOverlay from '@/components/features/PromptOverlay';
import { withDefaultCdnWidth } from '@/lib/image';
import { trackEvent } from '@/lib/analytics';

interface PhotoCardProps {
  src: string;
  alt: string;
  prompt?: string;
  mode?: 'fill' | 'fixed';
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  containerClassName?: string;
  imgClassName?: string;
  linkHref?: string;
  linkExternal?: boolean;
  ariaLabel?: string;
}

const MAX_ACCESSIBLE_NAME_LENGTH = 100;
const LINK_CLASS_NAME = 'group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900';

function getAccessibleName(ariaLabel: string | undefined, alt: string): string | undefined {
  const name = (ariaLabel || alt).replace(/\s+/g, ' ').trim();
  if (!name) return undefined;
  if (name.length <= MAX_ACCESSIBLE_NAME_LENGTH) return name;

  return `${name.slice(0, MAX_ACCESSIBLE_NAME_LENGTH - 1).trimEnd()}…`;
}

export default function PhotoCard({
  src,
  alt,
  prompt,
  mode = 'fill',
  width,
  height,
  sizes,
  priority,
  containerClassName = '',
  imgClassName = '',
  linkHref,
  linkExternal = false,
  ariaLabel
}: PhotoCardProps) {
  const optimizedSrc = withDefaultCdnWidth(src) || src;
  const accessibleName = getAccessibleName(ariaLabel, alt);
  const content = (
    <div className={`relative overflow-hidden group ${containerClassName}`}>
      {mode === 'fill' ? (
        <>
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800" />
          <Image
            src={optimizedSrc}
            alt={alt}
            fill
            sizes={sizes}
            className={`object-cover ${imgClassName}`}
            priority={priority}
          />
        </>
      ) : (
        <Image
          src={optimizedSrc}
          alt={alt}
          width={width}
          height={height}
          className={imgClassName}
          priority={priority}
        />
      )}
      <PromptOverlay prompt={prompt} />
    </div>
  );

  if (linkHref) {
    return linkExternal ? (
      <a
        href={linkHref}
        target="_blank"
        rel="noopener noreferrer"
        className={LINK_CLASS_NAME}
        aria-label={accessibleName}
        onClick={() => {
          const href = linkHref;
          if (!href) return;
          const isWebApp = href.includes('app.myaiphotoshoot.com');
          const isAppStore = href.includes('apps.apple.com');
          const isPlayStore = href.includes('play.google.com/store/apps/details?id=com.myaiphotoshoot');
          if (isWebApp || isAppStore || isPlayStore) {
            const action = isWebApp ? 'webapp_cta_click' : isAppStore ? 'app_store_cta_click' : 'google_play_cta_click';
            trackEvent(action, 'external_link', href);
          }
        }}
      >
        {content}
      </a>
    ) : (
      <Link href={linkHref} className={LINK_CLASS_NAME} aria-label={accessibleName}>
        {content}
      </Link>
    );
  }

  return content;
}
