import { injectable, inject } from "tsyringe";
import { eq } from "drizzle-orm";
import { db, users } from "@/db";
import { LoggingService } from "@/services/LoggingService";

export interface UserData {
  id: number;
  cuid: string;
  googleId: string;
  email: string;
  name?: string;
  provider: string;
  providerId?: string;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

@injectable()
export class UserDataAccess {
  constructor(
    @inject("LoggingService") private loggingService: LoggingService,
  ) {}

  async createOrUpdateUser(googleId: string, email: string, name: string): Promise<{ isNewUser: boolean; user: UserData }> {
    try {
      // First check if user exists
      this.loggingService.debug(`[USER_DATA_ACCESS] Checking if user exists with Google ID: ${googleId}`);
      const existingUser = await this.getUserByGoogleId(googleId);
      this.loggingService.debug(`[USER_DATA_ACCESS] Existing user found:`, existingUser);
      const isNewUser = !existingUser;

      if (isNewUser) {
        // Create new user
        const [newUser] = await db.insert(users).values({
          googleId: googleId,
          email: email,
          name: name || null,
          provider: 'google',
          providerId: googleId,
          lastLoginAt: new Date(),
        }).returning();
        
        this.loggingService.debug(`New user created: ${googleId}`);
        return { isNewUser: true, user: {
          id: newUser.id,
          cuid: newUser.cuid,
          googleId: newUser.googleId,
          email: newUser.email,
          name: newUser.name || undefined,
          provider: newUser.provider,
          providerId: newUser.providerId || undefined,
          lastLoginAt: newUser.lastLoginAt || undefined,
          createdAt: newUser.createdAt || undefined,
          updatedAt: undefined,
        } };
      } else {
        // Update existing user
        const [updatedUser] = await db.update(users)
          .set({
            email: email,
            name: name || null,
            lastLoginAt: new Date(),
          })
          .where(eq(users.googleId, googleId))
          .returning();
        
        this.loggingService.debug(`Existing user updated: ${googleId}`);
        return { isNewUser: false, user: {
          id: updatedUser.id,
          cuid: updatedUser.cuid,
          googleId: updatedUser.googleId,
          email: updatedUser.email,
          name: updatedUser.name || undefined,
          provider: updatedUser.provider,
          providerId: updatedUser.providerId || undefined,
          lastLoginAt: updatedUser.lastLoginAt || undefined,
          createdAt: updatedUser.createdAt || undefined,
          updatedAt: undefined,
        } };
      }
    } catch (error) {
      this.loggingService.error(`Error creating/updating user: ${error}`);
      throw error;
    }
  }

  async getUserByGoogleId(googleId: string): Promise<UserData | null> {
    try {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.googleId, googleId))
        .limit(1);

      if (result.length > 0) {
        const user = result[0];
        return {
          id: user.id,
          cuid: user.cuid,
          googleId: user.googleId,
          email: user.email,
          name: user.name || undefined,
          provider: user.provider,
          providerId: user.providerId || undefined,
        };
      }
      return null;
    } catch (error) {
      this.loggingService.error(`Error getting user by Google ID: ${error}`);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<UserData | null> {
    try {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (result.length > 0) {
        const user = result[0];
        return {
          id: user.id,
          cuid: user.cuid,
          googleId: user.googleId,
          email: user.email,
          name: user.name || undefined,
          provider: user.provider,
          providerId: user.providerId || undefined,
        };
      }
      return null;
    } catch (error) {
      this.loggingService.error(`Error getting user by email: ${error}`);
      throw error;
    }
  }

  async getUserById(id: number): Promise<UserData | null> {
    try {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (result.length > 0) {
        const user = result[0];
        return {
          id: user.id,
          cuid: user.cuid,
          googleId: user.googleId,
          email: user.email,
          name: user.name || undefined,
          provider: user.provider,
          providerId: user.providerId || undefined,
          lastLoginAt: user.lastLoginAt || undefined,
          createdAt: user.createdAt || undefined,
          updatedAt: undefined,
        };
      }

      return null;
    } catch (error) {
      this.loggingService.error(`Error getting user by ID: ${error}`);
      throw error;
    }
  }
}
