/**
 * AuthorCard Component
 * 
 * Author profile card with bio, social links, and article count.
 * 
 * @see components.avatar in design-system.json
 * 
 * @example
 * <AuthorCard 
 *   name="أحمد الشرعبي"
 *   role="المحرر السياسي"
 *   bio="صحفي متخصص في الشؤون السياسية..."
 *   imageUrl="/author.jpg"
 *   articleCount={127}
 * />
 */

import React from 'react';
import Link from 'next/link';
import { Icon, Avatar, Button } from '@/components/atoms';

export interface AuthorCardProps {
    /** Author name */
    name: string;
    /** Author role/title */
    role?: string;
    /** Author bio */
    bio?: string;
    /** Author image URL */
    imageUrl?: string;
    /** Number of articles written */
    articleCount?: number;
    /** Social media links */
    social?: {
        twitter?: string;
        facebook?: string;
        linkedin?: string;
    };
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** onClick handler for view profile (deprecated in favor of profileUrl) */
    onViewProfile?: () => void;
    /** Profile URL for navigation */
    profileUrl?: string;
    /** Additional CSS classes */
    className?: string;
}

export const AuthorCard: React.FC<AuthorCardProps> = ({
    name,
    role,
    bio,
    imageUrl,
    articleCount,
    social,
    size = 'md',
    onViewProfile,
    profileUrl,
    className = '',
}) => {
    const isCompact = size === 'sm';

    return (
        <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
            <div className={`flex ${isCompact ? 'items-center gap-4' : 'flex-col items-center text-center'}`}>
                {/* Avatar */}
                <Avatar
                    size={isCompact ? 'md' : 'lg'}
                    src={imageUrl}
                    alt={name}
                    placeholder={!imageUrl}
                />

                {/* Info */}
                <div className={isCompact ? '' : 'mt-4'}>
                    <h3 className="font-bold text-gray-900 text-lg">{name}</h3>
                    {role && (
                        <p className="text-primary text-sm font-medium">{role}</p>
                    )}
                    {articleCount !== undefined && (
                        <p className="text-gray-500 text-sm mt-1">
                            {articleCount.toLocaleString('ar-YE')} مقال منشور
                        </p>
                    )}
                </div>
            </div>

            {/* Bio */}
            {bio && !isCompact && (
                <p className="text-gray-600 text-sm mt-4 leading-relaxed">{bio}</p>
            )}

            {/* Social Links */}
            {social && !isCompact && (
                <div className="flex justify-center gap-3 mt-4">
                    {social.twitter && (
                        <a
                            href={social.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-primary hover:text-white transition-colors text-gray-600"
                            aria-label="تويتر"
                        >
                            <Icon name="ri-twitter-fill" size="sm" />
                        </a>
                    )}
                    {social.facebook && (
                        <a
                            href={social.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-primary hover:text-white transition-colors text-gray-600"
                            aria-label="فيسبوك"
                        >
                            <Icon name="ri-facebook-fill" size="sm" />
                        </a>
                    )}
                    {social.linkedin && (
                        <a
                            href={social.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-primary hover:text-white transition-colors text-gray-600"
                            aria-label="لينكدإن"
                        >
                            <Icon name="ri-linkedin-fill" size="sm" />
                        </a>
                    )}
                </div>
            )}

            {/* View Profile Button */}
            {profileUrl ? (
                <Link href={profileUrl} className="block w-full mt-4">
                    <Button variant="secondary" className="w-full">
                        عرض الملف الشخصي
                    </Button>
                </Link>
            ) : onViewProfile ? (
                <Button
                    variant="secondary"
                    onClick={onViewProfile}
                    className="w-full mt-4"
                >
                    عرض الملف الشخصي
                </Button>
            ) : null}
        </div>
    );
};

export default AuthorCard;
