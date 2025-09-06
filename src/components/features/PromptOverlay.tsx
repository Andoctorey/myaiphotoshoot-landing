'use client';

interface PromptOverlayProps {
  prompt?: string;
}

export default function PromptOverlay({ prompt }: PromptOverlayProps) {
  if (!prompt) return null;
  return (
    <div className="absolute inset-0 bg-black/70 dark:bg-black/80 opacity-0 hover:opacity-100 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-300 flex items-center justify-center p-3 overflow-y-auto">
      <div className="max-h-full w-full max-w-full">
        <p className="text-white text-xs break-words whitespace-pre-wrap text-center leading-snug">
          {prompt}
        </p>
      </div>
    </div>
  );
}


