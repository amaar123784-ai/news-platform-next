/**
 * ArticleContent Component
 * 
 * Rich text article body with proper typography styling for readability.
 * 
 * @see typography in design-system.json
 * 
 * @example
 * <ArticleContent content={htmlContent} />
 */

import React from 'react';

export interface ArticleContentProps {
    /** HTML content string */
    content: string;
    /** Additional CSS classes */
    className?: string;
}

export const ArticleContent: React.FC<ArticleContentProps> = ({
    content,
    className = '',
}) => {
    return (
        <div
            className={`
        prose prose-lg max-w-none break-words overflow-hidden
        prose-headings:font-bold prose-headings:text-gray-900
        prose-headings:font-arabic
        prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
        prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
        prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4 prose-p:text-lg
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-strong:text-gray-900 prose-strong:font-bold
        prose-blockquote:border-r-4 prose-blockquote:border-primary prose-blockquote:pr-4 prose-blockquote:italic prose-blockquote:text-gray-600 prose-blockquote:bg-gray-50 prose-blockquote:py-2
        prose-ul:list-disc prose-ul:pr-6
        prose-ol:list-decimal prose-ol:pr-6
        prose-li:mb-2
        prose-img:rounded-lg prose-img:shadow-sm prose-img:my-6 prose-img:w-full
        font-arabic
        ${className}
      `}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
};

export default ArticleContent;
