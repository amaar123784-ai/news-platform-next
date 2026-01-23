/**
 * RelatedArticles Component
 * 
 * Grid of related articles at the bottom of article pages.
 * 
 * @see components.cards.news in design-system.json
 * 
 * @example
 * <RelatedArticles articles={relatedNews} />
 */

import React from 'react';
import { Icon } from '@/components/atoms';
import { NewsCard } from '@/components/organisms';
import type { CategoryType } from '@/design-system/tokens';

export interface RelatedArticle {
    id: string;
    title: string;
    excerpt?: string;
    category: CategoryType;
    imageUrl: string;
    author?: string;
    timeAgo?: string;
}

export interface RelatedArticlesProps {
    /** Array of related articles */
    articles: RelatedArticle[];
    /** Section title */
    title?: string;
    /** Max number of articles to show */
    maxArticles?: number;
    /** Additional CSS classes */
    className?: string;
}

export const RelatedArticles: React.FC<RelatedArticlesProps> = ({
    articles,
    title = 'أخبار ذات صلة',
    maxArticles = 4,
    className = '',
}) => {
    const displayArticles = articles.slice(0, maxArticles);

    if (displayArticles.length === 0) return null;

    return (
        <section className={`mt-12 pt-8 border-t border-gray-200 ${className}`}>
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-6">
                <Icon name="ri-article-line" size="xl" className="text-primary" />
                <h2 className="text-xl font-bold">{title}</h2>
                <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {displayArticles.map((article) => (
                    <NewsCard
                        key={article.id}
                        title={article.title}
                        excerpt={article.excerpt}
                        category={article.category}
                        imageUrl={article.imageUrl}
                        author={article.author}
                        timeAgo={article.timeAgo}
                        href={`#article/${article.id}`}
                    />
                ))}
            </div>
        </section>
    );
};

export default RelatedArticles;
