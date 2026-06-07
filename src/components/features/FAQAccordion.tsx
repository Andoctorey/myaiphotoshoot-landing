'use client';

import { useId, useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export type FAQItem = {
  question: string;
  answer: string;
};

type Props = {
  title: string;
  description: string;
  items: FAQItem[];
};

export default function FAQAccordion({ title, description, items }: Props) {
  const faqId = useId();
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems((current) => (
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index]
    ));
  };

  return (
    <div
      className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8"
      aria-labelledby={`${faqId}-title`}
      aria-describedby={`${faqId}-description`}
    >
      <div className="mb-16 text-center">
        <h2
          id={`${faqId}-title`}
          className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl"
        >
          {title}
        </h2>
        <p
          id={`${faqId}-description`}
          className="mx-auto mt-4 max-w-3xl text-xl text-gray-600 dark:text-gray-300"
        >
          {description}
        </p>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => {
          const isOpen = openItems.includes(index);
          const triggerId = `${faqId}-trigger-${index}`;
          const panelId = `${faqId}-panel-${index}`;

          return (
            <div
              key={item.question}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <h3>
                <button
                  id={triggerId}
                  type="button"
                  onClick={() => toggleItem(index)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                >
                  <span className="text-lg font-medium text-gray-900 dark:text-white ltr:pr-4 rtl:pl-4">
                    {item.question}
                  </span>
                  <ChevronDownIcon
                    className={`h-5 w-5 flex-shrink-0 transform text-gray-500 transition-transform duration-200 dark:text-gray-400 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </h3>

              <div
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
                aria-hidden={!isOpen}
                className={`grid transition-[grid-template-rows,opacity] duration-300 motion-reduce:transition-none ${
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="px-6 pb-4 leading-relaxed text-gray-600 dark:text-gray-300">
                    {item.answer}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
