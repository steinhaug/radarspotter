import { 
  users, radarReports,
  type User, type InsertUser, 
  type RadarReport, type InsertRadarReport 
} from "@shared/schema";
import { db } from './db';
import { eq, desc, and, lt, gte } from 'drizzle-orm';
import { IStorage } from './storage';
import * as argon2 from 'argon2';

// Helper functions for distance calculations
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export class DatabaseStorage implements IStorage {
  private readonly TRIAL_DURATION_DAYS = 30;

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error("Error getting user by username:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    } catch (error) {
      console.error("Error getting user by email:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values(insertUser).returning();
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }
  
  async registerUser(userData: InsertUser): Promise<User> {
    try {
      // Hash the password
      const hashedPassword = await argon2.hash(userData.password);
      
      // Create user with hashed password
      const userWithHashedPassword = {
        ...userData,
        password: hashedPassword
      };
      
      const [user] = await db.insert(users).values(userWithHashedPassword).returning();
      return user;
    } catch (error) {
      console.error("Error registering user:", error);
      throw error;
    }
  }
  
  async updateUserPassword(userId: number, newPassword: string): Promise<void> {
    try {
      // Hash the new password
      const hashedPassword = await argon2.hash(newPassword);
      
      // Update the user's password
      await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error("Error updating user password:", error);
      throw error;
    }
  }

  // Radar report methods
  async createRadarReport(insertReport: InsertRadarReport): Promise<RadarReport> {
    try {
      // Get all active reports to process
      const allReports = await this.getActiveRadarReports();
      
      // Find very close reports (within 50 meters) - these are likely the same radar control
      const veryCloseReports = allReports.filter(report => {
        const distance = calculateDistance(
          insertReport.latitude, 
          insertReport.longitude, 
          report.latitude, 
          report.longitude
        );
        return distance <= 0.05; // 50 meters (in km)
      });
      
      // If we found very close reports, we'll update the most recent one
      if (veryCloseReports.length > 0) {
        // Sort by most recent first
        veryCloseReports.sort((a, b) => {
          return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
        });
        
        const mostRecent = veryCloseReports[0];
        const newVerifiedCount = mostRecent.verifiedCount + 1;
        
        // Update the most recent report
        const [updatedReport] = await db.update(radarReports)
          .set({
            reportedAt: new Date(),
            verifiedCount: newVerifiedCount,
            verified: true
          })
          .where(eq(radarReports.id, mostRecent.id))
          .returning();
        
        return updatedReport;
      }
      
      // If we didn't find very close reports, check for nearby reports for verification
      const nearbyReports = allReports.filter(report => {
        // Check time window (60 minutes)
        const reportTime = new Date(report.reportedAt).getTime();
        const timeDiff = new Date().getTime() - reportTime;
        const isWithinTimeWindow = timeDiff <= 60 * 60 * 1000; // 60 minutes
        
        if (!isWithinTimeWindow) return false;
        
        // Check distance (between 50-300 meters)
        const distance = calculateDistance(
          insertReport.latitude, 
          insertReport.longitude, 
          report.latitude, 
          report.longitude
        );
        
        return distance <= 0.3 && distance > 0.05; // Between 50-300 meters
      });
      
      // Determine if this report should be verified
      const isVerified = nearbyReports.length > 0;
      
      // Create the new report
      const [newReport] = await db.insert(radarReports)
        .values({
          ...insertReport,
          verified: isVerified,
          verifiedCount: 1,
          reportedAt: new Date(),
          active: true
        })
        .returning();
      
      // If this report is verified, update all nearby reports to be verified too
      if (isVerified) {
        for (const report of nearbyReports) {
          await db.update(radarReports)
            .set({ verified: true })
            .where(eq(radarReports.id, report.id));
        }
      }
      
      return newReport;
    } catch (error) {
      console.error("Error creating radar report:", error);
      throw error;
    }
  }

  async getActiveRadarReports(): Promise<RadarReport[]> {
    try {
      // Calculate the cutoff time for 3-hour old reports
      const threeHoursAgo = new Date();
      threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);
      
      // First, mark old reports as inactive
      await db.update(radarReports)
        .set({ active: false })
        .where(
          and(
            eq(radarReports.active, true),
            lt(radarReports.reportedAt, threeHoursAgo)
          )
        );
      
      // Then get all active reports
      const reports = await db.select()
        .from(radarReports)
        .where(eq(radarReports.active, true))
        .orderBy(desc(radarReports.reportedAt));
      
      return reports;
    } catch (error) {
      console.error("Error getting active radar reports:", error);
      return [];
    }
  }

  async getTrialStatus(userId: number): Promise<{ daysLeft: number, isSubscribed: boolean, trialStartDate: string }> {
    try {
      const user = await this.getUser(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
  
      if (user.subscribed) {
        return {
          daysLeft: 0,
          isSubscribed: true,
          trialStartDate: user.trialStartDate.toISOString()
        };
      }
  
      // Calculate days left in trial
      const trialStartDate = user.trialStartDate;
      const currentDate = new Date();
      const trialEndDate = new Date(trialStartDate);
      trialEndDate.setDate(trialEndDate.getDate() + this.TRIAL_DURATION_DAYS);
      
      const daysLeft = Math.max(
        0,
        Math.ceil((trialEndDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
      );
  
      return {
        daysLeft,
        isSubscribed: false,
        trialStartDate: user.trialStartDate.toISOString()
      };
    } catch (error) {
      console.error("Error getting trial status:", error);
      // Return default values if there's an error
      return {
        daysLeft: this.TRIAL_DURATION_DAYS,
        isSubscribed: false,
        trialStartDate: new Date().toISOString()
      };
    }
  }
}