/**
 * OAuth Service
 * Handles verification of Google and Facebook tokens and user mapping.
 */
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import { prisma } from '../index.js';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
/**
 * Verify Google ID Token
 */
export async function verifyGoogleToken(token) {
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email || !payload.sub)
            return null;
        return {
            id: payload.sub,
            email: payload.email,
            name: payload.name || payload.email.split('@')[0],
            avatar: payload.picture,
            provider: 'google',
        };
    }
    catch (error) {
        console.error('[OAuth] Google verification failed:', error);
        return null;
    }
}
/**
 * Verify Facebook Access Token
 */
export async function verifyFacebookToken(token) {
    try {
        // Verify with Facebook Graph API
        const response = await axios.get(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${token}`);
        const data = response.data;
        if (!data.id || !data.email)
            return null;
        return {
            id: data.id,
            email: data.email,
            name: data.name,
            avatar: data.picture?.data?.url,
            provider: 'facebook',
        };
    }
    catch (error) {
        console.error('[OAuth] Facebook verification failed:', error);
        return null;
    }
}
/**
 * Find or Create user from social profile
 */
export async function findOrCreateSocialUser(profile) {
    // 1. Try to find user by provider ID
    let user = await prisma.user.findFirst({
        where: {
            OR: [
                { googleId: profile.provider === 'google' ? profile.id : undefined },
                { facebookId: profile.provider === 'facebook' ? profile.id : undefined },
            ],
        },
    });
    if (user)
        return user;
    // 2. If not found by ID, try finding by email to link accounts
    user = await prisma.user.findUnique({
        where: { email: profile.email },
    });
    if (user) {
        // Link the account
        return await prisma.user.update({
            where: { id: user.id },
            data: {
                googleId: profile.provider === 'google' ? profile.id : user.googleId,
                facebookId: profile.provider === 'facebook' ? profile.id : user.facebookId,
                avatar: user.avatar || profile.avatar, // Update avatar if user doesn't have one
            },
        });
    }
    // 3. Create new user if no match found
    return await prisma.user.create({
        data: {
            email: profile.email,
            name: profile.name,
            avatar: profile.avatar,
            role: 'READER',
            googleId: profile.provider === 'google' ? profile.id : null,
            facebookId: profile.provider === 'facebook' ? profile.id : null,
            // Password remains null for social users
        },
    });
}
//# sourceMappingURL=oauth.service.js.map