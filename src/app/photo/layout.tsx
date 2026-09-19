import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Make one like this | My AI Photoshoot' },
  description: 'Use this public AI photo as inspiration and create your own version.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function PhotoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
