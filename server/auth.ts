import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import session from 'express-session';
import type { Express, Request, Response, NextFunction } from 'express';
import { loginSchema, type User } from '@shared/schema';
import { storage } from './storage';
import * as argon2 from 'argon2';
import ConnectPgSimple from 'connect-pg-simple';
import { pool } from './db';

// Create PostgreSQL session store
const PgSession = ConnectPgSimple(session);

export const setupAuth = (app: Express) => {
  // Configure session
  app.use(
    session({
      store: new PgSession({
        pool,
        tableName: 'sessions',
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || 'radar_alarm_secret_key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      },
    })
  );

  // Initialize passport and session
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy for passport
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Validate login credentials
        loginSchema.parse({ username, password });

        // Find user by username
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          return done(null, false, { message: 'Invalid username or password' });
        }

        // Verify password
        try {
          // If using plaintext passwords temporarily for development
          if (user.password === password) {
            return done(null, user);
          } else {
            // For production with argon2 hashed passwords
            const isValid = await argon2.verify(user.password, password);
            if (isValid) {
              return done(null, user);
            } else {
              return done(null, false, { message: 'Invalid username or password' });
            }
          }
        } catch (err) {
          return done(err);
        }
      } catch (err) {
        return done(err);
      }
    })
  );

  // Serialize user to the session
  passport.serializeUser((user: Express.User, done) => {
    done(null, (user as User).id);
  });

  // Deserialize user from the session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Authentication routes
  app.post('/api/auth/login', (req, res, next) => {
    passport.authenticate('local', (err: Error, user: User, info: { message: string }) => {
      if (err) {
        return res.status(500).json({ error: 'Server error during authentication' });
      }
      
      if (!user) {
        return res.status(401).json({ error: info?.message || 'Invalid credentials' });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ error: 'Failed to establish session' });
        }
        
        return res.json({
          id: user.id,
          username: user.username,
          language: user.language,
          trialStartDate: user.trialStartDate
        });
      });
    })(req, res, next);
  });

  app.get('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: 'Error during logout' });
      }
      
      res.redirect('/');
    });
  });

  app.get('/api/auth/user', (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const user = req.user as User;
    res.json({
      id: user.id,
      username: user.username,
      language: user.language,
      trialStartDate: user.trialStartDate
    });
  });
  
  // Registration endpoint
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, password, language } = req.body;
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      
      // Register new user
      const newUser = await storage.registerUser({
        username,
        password, // Will be hashed in registerUser method
        language: language || 'no' // Default to Norwegian
      });
      
      // Log in the newly registered user
      req.login(newUser, (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to establish session after registration' });
        }
        
        return res.status(201).json({
          id: newUser.id,
          username: newUser.username,
          language: newUser.language,
          trialStartDate: newUser.trialStartDate
        });
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  });
};

// Middleware to check if user is authenticated
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({ error: 'Authentication required' });
};