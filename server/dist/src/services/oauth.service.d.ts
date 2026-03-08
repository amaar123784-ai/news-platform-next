/**
 * OAuth Service
 * Handles verification of Google and Facebook tokens and user mapping.
 */
export interface SocialProfile {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    provider: 'google' | 'facebook';
}
/**
 * Verify Google ID Token
 */
export declare function verifyGoogleToken(token: string): Promise<SocialProfile | null>;
/**
 * Verify Facebook Access Token
 */
export declare function verifyFacebookToken(token: string): Promise<SocialProfile | null>;
/**
 * Find or Create user from social profile
 */
export declare function findOrCreateSocialUser(profile: SocialProfile): Promise<{
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
    email: string;
    password: string | null;
    role: import(".prisma/client").$Enums.Role;
    avatar: string | null;
    bio: string | null;
    googleId: string | null;
    facebookId: string | null;
    deletedAt: Date | null;
}>;
//# sourceMappingURL=oauth.service.d.ts.map