import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-this-in-production');

export interface SessionData {
  userId: string;
  googleId: string;
  email: string;
  name: string;
  provider: string;
  providerId: string;
}

export class SessionManager {
  private static readonly SESSION_COOKIE_NAME = 'edgar_session';
  
  static async createSession(sessionData: SessionData): Promise<string> {
    const token = await new SignJWT(sessionData as any)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d') // 7 days
      .sign(secret);

    return token;
  }

  static async verifySession(token: string): Promise<SessionData | null> {
    try {
      const { payload } = await jwtVerify(token, secret);
      return payload as unknown as SessionData;
    } catch (error) {
      return null;
    }
  }

  static async getSessionFromCookies(): Promise<SessionData | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SessionManager.SESSION_COOKIE_NAME);
    
    if (!sessionCookie) {
      return null;
    }

    return this.verifySession(sessionCookie.value);
  }

  static async setSessionCookie(sessionData: SessionData): Promise<void> {
    const token = await this.createSession(sessionData);
    const cookieStore = await cookies();
    
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    
    cookieStore.set(SessionManager.SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });
  }

  static async clearSessionCookie(): Promise<void> {
    const cookieStore = await cookies();
    
    cookieStore.set(SessionManager.SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || process.env.VERCEL === '1',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    });
  }
}
