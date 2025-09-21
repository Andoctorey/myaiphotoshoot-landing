'use client';

import Image from 'next/image';
import Link from 'next/link';
import PromptOverlay from '@/components/features/PromptOverlay';
import { withDefaultCdnWidth } from '@/lib/image';
import { trackEventAndNavigate } from '@/lib/analytics';

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
  figCaptionSrOnly?: string;
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
  ariaLabel,
  figCaptionSrOnly
}: PhotoCardProps) {
  const optimizedSrc = withDefaultCdnWidth(src) || src;
  const content = (
    <div className={`relative overflow-hidden group ${containerClassName}`} aria-label={ariaLabel}>
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
      {figCaptionSrOnly && (
        <figcaption className="sr-only">{figCaptionSrOnly}</figcaption>
      )}
    </div>
  );

  if (linkHref) {
    return linkExternal ? (
      <a href={linkHref} target="_blank" rel="noopener noreferrer" className="block"
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
          const href = linkHref;
          if (!href) return;
          const isWebApp = href.includes('app.myaiphotoshoot.com');
          const isAppStore = href.includes('apps.apple.com');
          const isPlayStore = href.includes('play.google.com/store/apps/details?id=com.myaiphotoshoot');
          if (isWebApp || isAppStore || isPlayStore) {
            e.preventDefault();
            const action = isWebApp ? 'webapp_cta_click' : isAppStore ? 'app_store_cta_click' : 'google_play_cta_click';
            trackEventAndNavigate(action, href);
          }
        }}
      >
        {content}
      </a>
    ) : (
      <Link href={linkHref} className="block">
        {content}
      </Link>
    );
  }

  return content;
}


