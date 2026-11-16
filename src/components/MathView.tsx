import React, { useMemo } from 'react';
import katex from 'katex';

interface MathViewProps {
  math: string;
  block?: boolean;
  className?: string;
}

export const MathView: React.FC<MathViewProps> = ({ math, block = false, className = '' }) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        throwOnError: false,
        displayMode: block,
      });
    } catch {
      return null;
    }
  }, [math, block]);

  if (!html) {
    return (
      <span className={`font-mono text-blue-700 text-sm ${className}`}>
        {math}
      </span>
    );
  }

  return (
    <span
      className={`${block ? 'block my-1.5 overflow-x-auto text-center' : 'inline-block'} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

