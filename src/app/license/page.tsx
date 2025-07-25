import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Image License & Usage Rights - My AI Photo Shoot',
  description: 'Learn about licensing and usage rights for AI-generated images created with MyAIPhotoShoot.',
  robots: 'index, follow',
};

export default function LicensePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Image License &amp; Usage Rights
          </h1>
          
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Image Ownership &amp; Rights
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                All AI-generated images created through MyAIPhotoShoot are owned by the users who generate them. 
                When you create an image using our service, you retain full ownership and commercial rights to that image.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                However, by using our service, you grant MyAIPhotoShoot a license to display your publicly shared 
                images in our gallery for promotional and service improvement purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                License Terms
              </h2>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
                <p className="text-gray-700 dark:text-gray-300 font-medium">
                  License Type: User-Owned Content with Platform License
                </p>
              </div>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                <li>You own all rights to images you generate</li>
                <li>You can use your images for personal and commercial purposes</li>
                <li>You can modify, distribute, and sell your generated images</li>
                <li>No attribution to MyAIPhotoShoot is required for your generated images</li>
                <li>Gallery images shown here are used with permission for demonstration purposes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Gallery Images
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                The images displayed in our public gallery are:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                <li>Generated by MyAIPhotoShoot users</li>
                <li>Shared with permission for promotional purposes</li>
                <li>Protected by their respective creators&apos; rights</li>
                <li>Used as examples of our AI generation capabilities</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Copyright Notice
              </h2>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300">
                  © 2025 My AI Photo Shoot. Platform and technology rights reserved.<br/>
                  Generated images remain the property of their creators.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Questions or Concerns?
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                If you have questions about image licensing, usage rights, or would like to report 
                any licensing concerns, please contact us at{' '}
                <a 
                  href="mailto:support@myaiphotoshoot.com" 
                  className="text-purple-600 dark:text-purple-400 hover:underline"
                >
                  support@myaiphotoshoot.com
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Additional Terms
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                For complete terms of service and privacy policy, please visit our{' '}
                <Link 
                  href="/legal" 
                  className="text-purple-600 dark:text-purple-400 hover:underline"
                >
                  legal page
                </Link>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
} 