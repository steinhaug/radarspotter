import { 
  users, 
  radarReports, 
  type User, 
  type InsertUser, 
  type RadarReport, 
  type InsertRadarReport 
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createRadarReport(report: InsertRadarReport): Promise<RadarReport>;
  getActiveRadarReports(): Promise<RadarReport[]>;
  getTrialStatus(userId: number): Promise<{ daysLeft: number, isSubscribed: boolean, trialStartDate: string }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private radarReports: Map<number, RadarReport>;
  private currentUserId: number;
  private currentReportId: number;
  private readonly TRIAL_DURATION_DAYS = 30;

  constructor() {
    this.users = new Map();
    this.radarReports = new Map();
    this.currentUserId = 1;
    this.currentReportId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      trialStartDate: now,
      subscribed: false,
    };
    this.users.set(id, user);
    return user;
  }

  async createRadarReport(insertReport: InsertRadarReport): Promise<RadarReport> {
    const id = this.currentReportId++;
    const now = new Date();
    
    const newReport: RadarReport = {
      ...insertReport,
      id,
      reportedAt: now,
      active: true,
    };
    
    this.radarReports.set(id, newReport);
    
    // Automatically expire reports after 30 minutes
    setTimeout(() => {
      const report = this.radarReports.get(id);
      if (report) {
        this.radarReports.set(id, { ...report, active: false });
      }
    }, 30 * 60 * 1000);
    
    return newReport;
  }

  async getActiveRadarReports(): Promise<RadarReport[]> {
    // Filter for active reports only, and sort by most recent first
    return Array.from(this.radarReports.values())
      .filter(report => report.active)
      .sort((a, b) => {
        const dateA = new Date(a.reportedAt).getTime();
        const dateB = new Date(b.reportedAt).getTime();
        return dateB - dateA;
      });
  }

  async getTrialStatus(userId: number): Promise<{ daysLeft: number, isSubscribed: boolean, trialStartDate: string }> {
    const user = await this.getUser(userId);
    
    if (!user) {
      throw new Error('User not found');
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
      isSubscribed: user.subscribed,
      trialStartDate: trialStartDate.toISOString(),
    };
  }
}

export const storage = new MemStorage();
