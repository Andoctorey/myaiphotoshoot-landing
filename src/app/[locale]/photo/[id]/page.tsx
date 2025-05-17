import { default as PhotoPageComponent } from '@/app/photo/[id]/page';

interface PhotoPageProps {
  params: {
    id: string;
    locale: string;
  }
}

export default async function PhotoPage({ params }: PhotoPageProps) {
  // With Next.js 15, params may be a Promise that needs to be awaited
  // We need to create a properly typed object to pass to the component
  return <PhotoPageComponent params={{ id: params.id }} />;
} 