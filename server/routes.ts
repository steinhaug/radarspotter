import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { reportSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Add endpoint to expose Mapbox API key
  app.get('/api/mapbox-key', (req, res) => {
    res.json({ key: process.env.MAPBOX_API_KEY });
  });
  
  // Add radar report endpoint
  app.post('/api/radar-reports', async (req, res) => {
    try {
      // Validate request body
      const validatedData = reportSchema.parse(req.body);
      
      // Create radar report
      const newReport = await storage.createRadarReport({
        userId: 1, // Default user ID since we're not implementing authentication
        ...validatedData
      });
      
      res.status(201).json(newReport);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        res.status(500).json({ message: 'Failed to create radar report' });
      }
    }
  });

  // Get all active radar reports
  app.get('/api/radar-reports', async (req, res) => {
    try {
      const allReports = await storage.getActiveRadarReports();
      
      // Group reports that are in very close proximity to ensure we only send one report per location
      const groupedReports = [];
      const processedIds = new Set();
      
      for (const report of allReports) {
        // Skip if we've already processed this report as part of a group
        if (processedIds.has(report.id)) continue;
        
        // Find all reports that are within 50 meters of this one
        const nearbyReports = allReports.filter(r => {
          // Skip if this is the same report or already processed
          if (r.id === report.id || processedIds.has(r.id)) return false;
          
          // Calculate distance between reports
          const R = 6371; // Radius of the earth in km
          const dLat = (r.latitude - report.latitude) * (Math.PI / 180);
          const dLon = (r.longitude - report.longitude) * (Math.PI / 180);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(report.latitude * (Math.PI / 180)) * Math.cos(r.latitude * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;
          
          return distance <= 0.05; // 50 meters
        });
        
        // Mark all nearby reports as processed
        nearbyReports.forEach(r => processedIds.add(r.id));
        
        // Mark this report as processed
        processedIds.add(report.id);
        
        // Use the most recent report as the representative for this group
        const groupReports = [report, ...nearbyReports].sort(
          (a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
        );
        
        const representativeReport = groupReports[0];
        
        // Add the report to our results with verification status based on number of reports
        groupedReports.push({
          ...representativeReport,
          verifiedCount: groupReports.length,
          verified: groupReports.length > 1
        });
      }
      
      res.json(groupedReports);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch radar reports' });
    }
  });

  // Get user trial status
  app.get('/api/user/trial-status', async (req, res) => {
    try {
      // Use a dummy user ID for demonstration
      const trialInfo = await storage.getTrialStatus(1);
      res.json(trialInfo);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch trial status' });
    }
  });

  // Create test user if it doesn't exist
  try {
    const existingUser = await storage.getUserByUsername('testuser');
    if (!existingUser) {
      await storage.createUser({
        username: 'testuser',
        password: 'password',
        language: 'en',
      });
    }
  } catch (error) {
    console.error('Error creating test user:', error);
  }

  const httpServer = createServer(app);

  return httpServer;
}
