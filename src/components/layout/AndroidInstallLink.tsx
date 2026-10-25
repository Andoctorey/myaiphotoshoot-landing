'use client';

import { createContext, useContext, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { usePathname } from 'next/navigation';

type InstallLink = { url?: string; pending: boolean; trackClick?: () => void };
type PageInstallLink = InstallLink & { pathname: string };

const LinkContext = createContext<InstallLink>({ pending: false });
const UpdateContext = createContext<Dispatch<SetStateAction<PageInstallLink | null>> | null>(null);

export function AndroidInstallLinkProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname().replace(/^\/en\//, '/');
  const [target, setTarget] = useState<PageInstallLink | null>(null);
  // Navigation can render before the new page publishes its selection.
  const needsSelection = /^\/(?:[a-z]{2}\/)?(?:presets\/[^/]+|masks(?:\/[^/]+)?)\/?$/.test(pathname);
  const link = target?.pathname === pathname ? target : { pending: needsSelection };

  return (
    <UpdateContext.Provider value={setTarget}>
      <LinkContext.Provider value={link}>{children}</LinkContext.Provider>
    </UpdateContext.Provider>
  );
}

export function useAndroidInstallLink(): InstallLink {
  return useContext(LinkContext);
}

export function usePageAndroidInstallLink(pathname: string | undefined, url: string | undefined, pending = false, trackClick?: () => void) {
  const update = useContext(UpdateContext);

  useEffect(() => {
    if (!update || !pathname) return;
    // Use the content's own route, even if navigation has already advanced the router pathname.
    const target = { pathname, url, pending, trackClick };
    update(target);
    return () => update(current => current === target ? null : current);
  }, [pathname, url, pending, trackClick, update]);
}
