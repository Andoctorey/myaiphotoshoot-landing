import { readFileSync } from 'fs';
import { join } from 'path';

function getLegalArticleHtml(): string {
  const filePath = join(process.cwd(), 'public', 'legal.html');
  const html = readFileSync(filePath, 'utf8');
  const match = html.match(/<article\b[^>]*>[\s\S]*<\/article>/i);

  if (!match) {
    throw new Error('Could not extract legal article from public/legal.html');
  }

  return match[0]
    .replaceAll('http://myaiphotoshoot.com/', 'https://myaiphotoshoot.com/')
    .replaceAll('My Ai Photo Shoot', 'My AI Photo Shoot');
}

export default function LegalDocument() {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .legal-document {
              line-height: 1.6;
              color: rgb(55 65 81);
            }
            .dark .legal-document {
              color: rgb(209 213 219);
            }
            .legal-document a {
              color: rgb(147 51 234);
              text-decoration: underline;
            }
            .dark .legal-document a {
              color: rgb(192 132 252);
            }
            .legal-document .page-title {
              margin: 0 0 1.5rem;
              color: rgb(17 24 39);
              font-size: clamp(2rem, 5vw, 3rem);
              font-weight: 700;
              line-height: 1.1;
              letter-spacing: -0.03em;
            }
            .dark .legal-document .page-title,
            .dark .legal-document h1,
            .dark .legal-document h2,
            .dark .legal-document h3 {
              color: white;
            }
            .legal-document h1,
            .legal-document h2,
            .legal-document h3 {
              color: rgb(17 24 39);
              font-weight: 700;
              line-height: 1.25;
              letter-spacing: -0.01em;
            }
            .legal-document h1 {
              margin: 2rem 0 0.75rem;
              font-size: 1.875rem;
            }
            .legal-document h2 {
              margin: 2rem 0 0.75rem;
              font-size: 1.5rem;
            }
            .legal-document h3 {
              margin: 1.5rem 0 0.5rem;
              font-size: 1.25rem;
            }
            .legal-document p {
              margin: 0.75rem 0;
            }
            .legal-document ol {
              margin: 1rem 0;
              padding-inline-start: 1.75rem;
            }
            .legal-document li {
              margin: 0.5rem 0;
            }
            .legal-document :target {
              scroll-margin-top: 6rem;
            }
          `,
        }}
      />
      <div
        className="legal-document"
        dangerouslySetInnerHTML={{ __html: getLegalArticleHtml() }}
      />
    </>
  );
}
