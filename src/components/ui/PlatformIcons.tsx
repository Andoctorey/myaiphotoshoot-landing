import Image from 'next/image';

export function StoreIcon({ platform }: { platform: 'ios' | 'android' }) {
  if (platform === 'android') {
    return <Image src="/images/google-play-icon.svg" alt="" aria-hidden="true" width={20} height={20} className="h-5 w-5 shrink-0" />;
  }

  return (
    <svg viewBox="16 7 40 42" fill="currentColor" aria-hidden="true" className="h-5 w-5 shrink-0">
      <path d="M45.5783 29.1814C45.5344 24.4275 49.5706 22.1147 49.7552 22.007C47.4693 18.7576 43.9263 18.3136 42.6812 18.2782C39.7055 17.9729 36.819 20.0143 35.3032 20.0143C33.7571 20.0143 31.4228 18.3077 28.907 18.3578C25.6695 18.4065 22.6409 20.234 20.9798 23.0719C17.5518 28.8584 20.1084 37.3617 23.3928 42.0389C25.0357 44.3296 26.9554 46.8873 29.4682 46.7973C31.9266 46.6985 32.8449 45.2692 35.8115 45.2692C38.7509 45.2692 39.6132 46.7973 42.1759 46.7398C44.8143 46.6985 46.4754 44.4388 48.0608 42.1275C49.9594 39.502 50.7219 36.9163 50.7521 36.7835C50.6901 36.7629 45.6282 34.8793 45.5783 29.1814Z" />
      <path d="M40.7372 15.2013C42.0594 13.5892 42.9641 11.3958 42.713 9.17006C40.7993 9.25266 38.406 10.4607 37.0278 12.0375C35.8085 13.4269 34.7192 15.7043 35.0006 17.846C37.1503 18.0024 39.3575 16.7884 40.7372 15.2013Z" />
    </svg>
  );
}

export function WebIcon({ className = 'h-5 w-5 shrink-0' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" strokeWidth={1.8} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2 12h20M12 2c2.5 2.73 3.9 6.23 3.9 10S14.5 19.27 12 22M12 2C9.5 4.73 8.1 8.23 8.1 12s1.4 7.27 3.9 10" />
    </svg>
  );
}
