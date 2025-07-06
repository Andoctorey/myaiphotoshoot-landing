'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  className?: string;
  title?: string;
}

export default function TableOfContents({ content, className = '', title = 'Table of Contents' }: TableOfContentsProps) {
  const [tocItems, setTocItems] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // Extract headings from content HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const items: TOCItem[] = [];

    headings.forEach((heading, index) => {
      const text = heading.textContent || '';
      const level = parseInt(heading.tagName.charAt(1));
      const id = `heading-${index}`;
      
      items.push({ id, text, level });
    });

    setTocItems(items);

    // Add IDs to actual rendered headings in the DOM
    setTimeout(() => {
      const articleContainer = document.querySelector('.medium-style-article');
      if (articleContainer) {
        const actualHeadings = articleContainer.querySelectorAll('h1, h2, h3, h4, h5, h6');
        actualHeadings.forEach((heading, index) => {
          const id = `heading-${index}`;
          heading.id = id;
        });

        // Set up intersection observer for active heading
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                setActiveId(entry.target.id);
              }
            });
          },
          {
            rootMargin: '-20% 0% -35% 0%',
            threshold: 0,
          }
        );

        // Observe the headings with IDs
        actualHeadings.forEach((heading) => {
          if (heading.id) {
            observer.observe(heading);
          }
        });

        return () => observer.disconnect();
      }
    }, 200);
  }, [content]);

  if (tocItems.length <= 1) {
    return null; // Don't show TOC for short articles
  }

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 120; // Account for fixed header and padding
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      // Update active ID immediately for better UX
      setActiveId(id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className={`${
        className?.includes('bg-white/') || className?.includes('bg-gray-800/') || className?.includes('bg-transparent')
          ? '' 
          : 'bg-gray-50 dark:bg-gray-900'
      } rounded-lg p-6 ${className}`}
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>
      
      <nav className="space-y-2">
        {tocItems.map((item, index) => (
          <button
            key={index}
            onClick={() => scrollToHeading(item.id)}
            className={`block w-full text-left text-sm transition-all duration-200 cursor-pointer rounded-md p-2 ${
              item.level === 1
                ? 'font-semibold text-gray-900 dark:text-white'
                : item.level === 2
                ? 'font-medium text-gray-800 dark:text-gray-200'
                : 'text-gray-600 dark:text-gray-400'
            } ${
              activeId === item.id
                ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20'
                : 'hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10'
            }`}
            style={{
              paddingLeft: `${(item.level - 1) * 16}px`,
            }}
          >
            <span className="block py-1 border-l-2 border-transparent hover:border-purple-300 dark:hover:border-purple-600 pl-3 transition-all duration-200">
              {item.text}
            </span>
          </button>
        ))}
      </nav>
    </motion.div>
  );
} 