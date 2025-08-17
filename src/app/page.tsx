import { redirect } from 'next/navigation';

export default function Home() {
  // Server-side 308 redirect to default locale for SEO and performance
  redirect('/en');
}
