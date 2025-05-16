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
      const reports = await storage.getActiveRadarReports();
      res.json(reports);
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
