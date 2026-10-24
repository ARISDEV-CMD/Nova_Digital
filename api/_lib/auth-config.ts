import type { AuthConfig } from '@auth/core';
import Credentials from '@auth/core/providers/credentials';
import Google from '@auth/core/providers/google';
import { authenticateEmailAccount, getOrCreateGoogleProfile, getProfileById } from './supabase-admin.ts';

type AppToken = { appUserId?: string; appRole?: string };

const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

export const authConfig: AuthConfig = {
  basePath: '/api/auth',
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 14 },
  providers: [
    Google({ clientId: googleClientId, clientSecret: googleClientSecret }),
    Credentials({
      id: 'email-password',
      name: 'Adresse e-mail et mot de passe',
      credentials: {
        email: { label: 'Adresse e-mail', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (typeof credentials.email !== 'string' || typeof credentials.password !== 'string') return null;
        const profile = await authenticateEmailAccount(credentials.email, credentials.password);
        return profile ? { id: profile.id, email: profile.email, name: profile.full_name, image: null, role: profile.role } : null;
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile, user }) {
      if (account?.provider === 'email-password') return Boolean(user?.id);
      return Boolean(profile?.email && profile.email_verified === true && profile.sub);
    },
    async jwt({ token, account, profile, user }) {
      const appToken = token as typeof token & AppToken;
      if (account?.provider === 'email-password' && user?.id) {
        const appProfile = await getProfileById(user.id);
        if (!appProfile) return null;
        appToken.appUserId = appProfile.id;
        appToken.appRole = appProfile.role;
        appToken.email = appProfile.email;
        appToken.name = appProfile.full_name;
        appToken.picture = null;
      } else if (account?.provider === 'google' && profile?.sub && profile.email) {
        const appProfile = await getOrCreateGoogleProfile({
          subject: String(profile.sub),
          email: String(profile.email),
          name: typeof profile.name === 'string' ? profile.name : null,
        });
        appToken.appUserId = appProfile.id;
        appToken.appRole = appProfile.role;
        appToken.email = appProfile.email;
        appToken.name = appProfile.full_name;
        appToken.picture = typeof profile.picture === 'string' ? profile.picture : null;
      } else if (appToken.appUserId) {
        const appProfile = await getProfileById(appToken.appUserId);
        if (!appProfile) return null;
        appToken.appRole = appProfile.role;
        appToken.email = appProfile.email;
        appToken.name = appProfile.full_name;
      }
      return appToken;
    },
    async session({ session, token }) {
      const appToken = token as typeof token & AppToken;
      if (session.user && appToken.appUserId) {
        Object.assign(session.user, {
          id: appToken.appUserId,
          role: appToken.appRole || 'customer',
          email: appToken.email,
          name: appToken.name,
          image: appToken.picture,
        });
      }
      return session;
    },
  },
};
