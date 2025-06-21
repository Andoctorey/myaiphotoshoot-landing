import { Metadata } from 'next';
import Link from 'next/link';

// This would be better handled with proper i18n, but for now using the static HTML content
export const metadata: Metadata = {
  title: 'Legal - Terms of Service and Privacy Policy - My AI Photo Shoot',
  description: 'Terms of Service and Privacy Policy for My AI Photo Shoot',
  robots: 'index, follow',
};

export default function LegalPage() {
  // For now, redirect to the static HTML file or serve the legal content
  // You can either:
  // 1. Convert the legal.html content to a React component
  // 2. Or redirect to the static file
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Legal - Terms of Service and Privacy Policy
          </h1>
          
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              For our complete Terms of Service and Privacy Policy, please visit:
            </p>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
              <a 
                href="/legal.html" 
                className="text-purple-600 dark:text-purple-400 hover:underline text-lg font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Full Legal Document →
              </a>
            </div>
            
            <div className="mt-8 grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Quick Access
                </h2>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li>
                    <Link href="/license" className="text-purple-600 dark:text-purple-400 hover:underline">
                      Image License &amp; Usage Rights
                    </Link>
                  </li>
                  <li>
                    <a href="/legal.html#privacy" className="text-purple-600 dark:text-purple-400 hover:underline">
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a href="/legal.html#terms" className="text-purple-600 dark:text-purple-400 hover:underline">
                      Terms of Service
                    </a>
                  </li>
                </ul>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Contact
                </h2>
                <p className="text-gray-700 dark:text-gray-300">
                  Questions about our legal terms?<br/>
                  <a 
                    href="mailto:support@myaiphotoshoot.com" 
                    className="text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    support@myaiphotoshoot.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 