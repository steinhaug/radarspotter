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
    
    // Find very close reports (within 50 meters) - these are likely the same radar control
    const veryCloseReports = Array.from(this.radarReports.values()).filter(report => {
      // Only consider active reports
      if (!report.active) return false;
      
      // Check if within 3 hours (to maintain consistency with cleanup time)
      const reportTime = new Date(report.reportedAt).getTime();
      const timeDiff = now.getTime() - reportTime;
      const isWithinTimeWindow = timeDiff <= 3 * 60 * 60 * 1000; // 3 hours
      
      if (!isWithinTimeWindow) return false;
      
      // Check if very close (within 50 meters) - same exact control
      const distance = this.calculateDistance(
        insertReport.latitude, 
        insertReport.longitude, 
        report.latitude, 
        report.longitude
      );
      
      return distance <= 0.05; // 50 meters (in km)
    });
    
    // If we found very close reports, we'll update the most recent one
    // and NOT create a new report
    if (veryCloseReports.length > 0) {
      // Sort by most recent first
      veryCloseReports.sort((a, b) => {
        return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
      });
      
      const mostRecent = veryCloseReports[0];
      const updatedReport = {
        ...mostRecent,
        reportedAt: now, // Update timestamp to now
        verifiedCount: mostRecent.verifiedCount + 1,
        verified: true, // Mark as verified since it's been reported multiple times
      };
      
      this.radarReports.set(mostRecent.id, updatedReport);
      return updatedReport;
    }
    
    // If we didn't find very close reports, we'll proceed with checking nearby reports
    // for verification purposes (within 300 meters)
    const nearbyReports = Array.from(this.radarReports.values()).filter(report => {
      // Only consider active reports
      if (!report.active) return false;
      
      // Check if within the last 60 minutes
      const reportTime = new Date(report.reportedAt).getTime();
      const timeDiff = now.getTime() - reportTime;
      const isWithinTimeWindow = timeDiff <= 60 * 60 * 1000; // 60 minutes
      
      if (!isWithinTimeWindow) return false;
      
      // Check if within 300 meters
      const distance = this.calculateDistance(
        insertReport.latitude, 
        insertReport.longitude, 
        report.latitude, 
        report.longitude
      );
      
      return distance <= 0.3 && distance > 0.05; // Between 50-300 meters (in km)
    });
    
    // Create the new report
    let verifiedCount = 1;
    let isVerified = false;
    
    if (nearbyReports.length > 0) {
      // Found nearby reports, so this will be verified
      isVerified = true;
      
      // Update ALL nearby reports to be verified
      nearbyReports.forEach(report => {
        this.radarReports.set(report.id, {
          ...report,
          verified: true
        });
      });
    }
    
    // Create the new report
    const newReport: RadarReport = {
      ...insertReport,
      id,
      reportedAt: now,
      active: true,
      verified: isVerified,
      verifiedCount
    };
    
    this.radarReports.set(id, newReport);
    
    // Automatically expire reports after 3 hours
    setTimeout(() => {
      const report = this.radarReports.get(id);
      if (report) {
        this.radarReports.set(id, { ...report, active: false });
      }
    }, 3 * 60 * 60 * 1000);
    
    return newReport;
  }
  
  // Helper function to calculate distance between two coordinates in kilometers
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  async getActiveRadarReports(): Promise<RadarReport[]> {
    const currentTime = new Date().getTime();
    const threeHoursInMs = 3 * 60 * 60 * 1000;
    
    // Filter for reports less than 3 hours old and active, then sort by most recent first
    return Array.from(this.radarReports.values())
      .filter(report => {
        const reportTime = new Date(report.reportedAt).getTime();
        const isLessThanThreeHoursOld = (currentTime - reportTime) < threeHoursInMs;
        
        // If not less than 3 hours old, mark it as inactive
        if (!isLessThanThreeHoursOld && report.active) {
          const reportId = report.id;
          this.radarReports.set(reportId, { ...report, active: false });
          return false;
        }
        
        return report.active;
      })
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
