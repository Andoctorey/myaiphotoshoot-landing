'use client';

import { useState } from 'react';
import { useTranslations } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export default function SupportForm() {
  const t = useTranslations('supportPage');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    message?: string;
  }>({});

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const validateForm = () => {
    const errors: {
      email?: string;
      message?: string;
    } = {};
    
    if (!email) {
      errors.email = t('form.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = t('form.invalidEmail');
    }
    
    if (!message) {
      errors.message = t('form.messageRequired');
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus('idle');
    
    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, message }),
      });
      
      if (response.ok) {
        setSubmitStatus('success');
        setEmail('');
        setMessage('');
      } else {
        setSubmitStatus('error');
      }
    } catch {
      // Handle error
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-extrabold text-center mb-4">{t('title')}</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 text-center max-w-3xl mx-auto mb-12">{t('description')}</p>
        
        <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md dark:shadow-gray-900 border border-gray-200 dark:border-gray-700">
          {/* Response time expectations */}
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 px-4 py-3 rounded mb-6">
            <p className="text-sm flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('form.responseTime')}
            </p>
          </div>
          
          {submitStatus === 'success' ? (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
              <p>{t('form.success')}</p>
            </div>
          ) : submitStatus === 'error' ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              <p>{t('form.error')}</p>
            </div>
          ) : null}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('form.email')}
              </label>
              <input
                type="email"
                id="email"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 ${
                  validationErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder={t('form.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.email}</p>
              )}
            </div>
            
            <div className="mb-6">
              <label htmlFor="message" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('form.message')}
              </label>
              <textarea
                id="message"
                rows={5}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 ${
                  validationErrors.message ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder={t('form.messagePlaceholder')}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isSubmitting}
              />
              {validationErrors.message && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.message}</p>
              )}
            </div>
            
            {/* Privacy notice */}
            <div className="mb-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('form.privacyNotice')}
              </p>
            </div>
            
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('form.submit')}
                </span>
              ) : (
                t('form.submit')
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
} 