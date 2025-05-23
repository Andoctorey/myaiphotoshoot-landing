import Link from 'next/link'
import Script from 'next/script'

interface BreadcrumbProps {
  items: {
    label: string;
    href?: string;
  }[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  // Create JSON-LD for breadcrumbs
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.href ? `https://myaiphotoshoot.com${item.href}` : undefined,
    })),
  }

  return (
    <>
      <Script
        id="breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="flex mb-4" aria-label="Breadcrumb">
        <ol className="inline-flex items-center ltr:space-x-1 rtl:space-x-reverse md:ltr:space-x-3 md:rtl:space-x-reverse">
          {items.map((item, index) => (
            <li key={index} className="inline-flex items-center">
              {index > 0 && (
                <svg className="w-3 h-3 text-gray-400 ltr:mx-1 rtl:mx-1 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                </svg>
              )}
              {item.href ? (
                <Link
                  href={item.href}
                  className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-purple-600"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-sm font-medium text-gray-500">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  )
} 