'use client';

import Image from 'next/image';
import { useState } from 'react';

type Props = {
  src: string;
  alt: string;
  hasActiveTest: boolean;
  resolved: boolean;
  eager: boolean;
};

export default function PresetGridImage({ src, alt, hasActiveTest, resolved, eager }: Props) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  // Keep the card dimensions and title visible, but never paint Main Version
  // while an experiment is resolving. Key Image by URL so a delayed decode from
  // the previous image cannot call the replacement image's onLoad callback.
  const visible = !hasActiveTest || (resolved && loadedSrc === src);
  return (
    <Image
      key={src}
      src={src}
      alt={alt}
      width={640}
      height={640}
      sizes="(min-width: 1280px) 304px, (min-width: 1100px) calc((100vw - 67px) / 4), (min-width: 830px) calc((100vw - 50px) / 3), calc((100vw - 33px) / 2)"
      className={`preset-test-card-image h-full w-full object-cover${visible ? '' : ' invisible'}`}
      loading={eager ? 'eager' : 'lazy'}
      onLoad={() => setLoadedSrc(src)}
    />
  );
}
