interface FAQ {
  question: string;
  answer: string;
}

interface FAQSchemaProps {
  faqs: FAQ[];
}

export default function FAQSchema({ faqs }: FAQSchemaProps) {
  if (!faqs || faqs.length === 0) {
    return null;
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
    />
  );
}

// Utility function to extract FAQs from blog content
export const extractFAQsFromContent = (content: string): FAQ[] => {
  const faqs: FAQ[] = [];
  
  // Create a temporary DOM element to parse the HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;
  
  // Look for common FAQ patterns
  const headings = tempDiv.querySelectorAll('h2, h3, h4');
  
  headings.forEach((heading) => {
    const questionText = heading.textContent || '';
    
    // Check if this looks like a question (contains ? or starts with common question words)
    const isQuestion = questionText.includes('?') ||
      /^(what|how|why|when|where|who|can|should|will|do|does|is|are)/i.test(questionText.trim());
    
    if (isQuestion) {
      // Get the next element which should contain the answer
      let nextElement = heading.nextElementSibling;
      let answerText = '';
      
      // Collect answer content from following elements until next heading
      while (nextElement && !nextElement.matches('h1, h2, h3, h4, h5, h6')) {
        answerText += nextElement.textContent || '';
        nextElement = nextElement.nextElementSibling;
      }
      
      if (answerText.trim()) {
        faqs.push({
          question: questionText.trim(),
          answer: answerText.trim(),
        });
      }
    }
  });
  
  return faqs;
}; 