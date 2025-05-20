import { db } from './db';
import { achievements, userAchievements } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

// Predefined list of achievements
export const ACHIEVEMENTS = [
  {
    key: 'first_report',
    name: {
      en: 'First Reporter',
      no: 'Første rapportør',
    },
    description: {
      en: 'Submit your first radar report',
      no: 'Send inn din første radarrapport',
    },
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>',
    maxProgress: 1,
  },
  {
    key: 'five_reports',
    name: {
      en: 'Regular Reporter', 
      no: 'Fast rapportør',
    },
    description: {
      en: 'Submit 5 radar reports',
      no: 'Send inn 5 radarrapporter',
    },
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
    maxProgress: 5,
  },
  {
    key: 'verified_report',
    name: {
      en: 'Verified Reporter',
      no: 'Bekreftet rapportør',
    },
    description: {
      en: 'Have one of your reports verified by other users',
      no: 'Få en av dine rapporter bekreftet av andre brukere',
    },
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    maxProgress: 1,
  },
  {
    key: 'verifier',
    name: {
      en: 'Verifier',
      no: 'Bekrefter',
    },
    description: {
      en: 'Verify 3 reports from other users',
      no: 'Bekreft 3 rapporter fra andre brukere',
    },
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>',
    maxProgress: 3,
  },
  {
    key: 'active_week',
    name: {
      en: 'Active Week',
      no: 'Aktiv uke',
    },
    description: {
      en: 'Use the app for 7 consecutive days',
      no: 'Bruk appen i 7 dager på rad',
    },
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
    maxProgress: 7,
  },
  {
    key: 'early_adopter',
    name: {
      en: 'Early Adopter',
      no: 'Tidlig bruker',
    },
    description: {
      en: 'Sign up in the first month after launch',
      no: 'Registrer deg i den første måneden etter lansering',
    },
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path><line x1="16" y1="8" x2="2" y2="22"></line><line x1="17.5" y1="15" x2="9" y2="15"></line></svg>',
    maxProgress: 1,
  }
];

// Initialize achievements in the database
export async function initializeAchievements() {
  try {
    // Check if achievements already exist
    const existingAchievements = await db.select().from(achievements);
    
    if (existingAchievements.length === 0) {
      // Insert all predefined achievements
      for (const achievement of ACHIEVEMENTS) {
        await db.insert(achievements).values({
          key: achievement.key,
          name: JSON.stringify(achievement.name),
          description: JSON.stringify(achievement.description),
          icon: achievement.icon,
          maxProgress: achievement.maxProgress
        });
      }
      console.log('Achievements initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing achievements:', error);
  }
}

// Initialize achievements for a new user
export async function initializeUserAchievements(userId: number) {
  try {
    const allAchievements = await db.select().from(achievements);
    
    // Create user achievement entries for each achievement
    for (const achievement of allAchievements) {
      await db.insert(userAchievements).values({
        userId,
        achievementId: achievement.id,
        progress: 0,
        unlocked: false
      });
    }
    
    // Automatically unlock early adopter achievement
    const earlyAdopterAchievement = allAchievements.find(a => 
      JSON.parse(a.key === 'early_adopter' ? a.key : '{}')
    );
    
    if (earlyAdopterAchievement) {
      await updateAchievementProgress(userId, 'early_adopter', 1);
    }
    
    console.log(`Achievements initialized for user ${userId}`);
  } catch (error) {
    console.error(`Error initializing achievements for user ${userId}:`, error);
  }
}

// Update achievement progress and check for unlocks
export async function updateAchievementProgress(userId: number, achievementKey: string, progressIncrement: number = 1) {
  try {
    // Get the achievement by key
    const [achievement] = await db
      .select()
      .from(achievements)
      .where(eq(achievements.key, achievementKey));
    
    if (!achievement) {
      console.error(`Achievement with key ${achievementKey} not found`);
      return;
    }
    
    // Get the user's progress for this achievement
    const [userAchievement] = await db
      .select()
      .from(userAchievements)
      .where(and(
        eq(userAchievements.userId, userId),
        eq(userAchievements.achievementId, achievement.id)
      ));
    
    if (!userAchievement) {
      console.error(`User achievement not found for user ${userId} and achievement ${achievement.id}`);
      return;
    }
    
    // Skip if already unlocked
    if (userAchievement.unlocked) {
      return;
    }
    
    // Calculate new progress
    const newProgress = Math.min(userAchievement.progress + progressIncrement, achievement.maxProgress);
    
    // Check if achievement should be unlocked
    const unlocked = newProgress >= achievement.maxProgress;
    
    // Update user achievement record
    await db
      .update(userAchievements)
      .set({
        progress: newProgress,
        unlocked,
        unlockedAt: unlocked ? new Date() : null,
        updatedAt: new Date()
      })
      .where(and(
        eq(userAchievements.userId, userId),
        eq(userAchievements.achievementId, achievement.id)
      ));
    
    console.log(`Achievement progress updated for user ${userId}, achievement ${achievementKey}: ${newProgress}/${achievement.maxProgress}`);
    
    if (unlocked) {
      console.log(`Achievement ${achievementKey} unlocked for user ${userId}!`);
    }
    
    return unlocked;
  } catch (error) {
    console.error(`Error updating achievement progress:`, error);
    return false;
  }
}

// Get all user achievements
export async function getUserAchievements(userId: number, language: string = 'en') {
  try {
    const results = await db
      .select()
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId));
    
    return results.map(({ user_achievements, achievements }) => {
      const achievementName = JSON.parse(achievements.name);
      const achievementDescription = JSON.parse(achievements.description);
      
      return {
        id: achievements.id,
        key: achievements.key,
        name: achievementName[language] || achievementName.en,
        description: achievementDescription[language] || achievementDescription.en,
        icon: achievements.icon,
        unlocked: user_achievements.unlocked,
        progress: user_achievements.progress,
        maxProgress: achievements.maxProgress,
        unlockedAt: user_achievements.unlockedAt
      };
    });
  } catch (error) {
    console.error(`Error fetching user achievements:`, error);
    return [];
  }
}

// Get user statistics
export async function getUserStats(userId: number) {
  try {
    // Get count of reports submitted by user
    const [reportsSubmittedResult] = await db
      .select({ count: db.fn.count() })
      .from(achievements)
      .where(eq(achievements.key, 'user_id'));
    
    const reportsSubmitted = Number(reportsSubmittedResult?.count || 0);
    
    // Get count of verified reports by user
    const [verifiedReportsResult] = await db
      .select({ count: db.fn.count() })
      .from(achievements)
      .where(eq(achievements.key, 'verified_count'));
    
    const reportsVerified = Number(verifiedReportsResult?.count || 0);
    
    // Get latest report date
    const [lastReportResult] = await db
      .select()
      .from(achievements)
      .orderBy(achievements.key)
      .limit(1);
    
    const lastReport = lastReportResult ? new Date(lastReportResult.key) : undefined;
    
    // Calculate days active (based on how many different days the user submitted reports)
    const daysActive = 1; // Placeholder - would need more complex query with date calculation
    
    return {
      reportsSubmitted,
      reportsVerified,
      daysActive,
      lastReport
    };
  } catch (error) {
    console.error(`Error fetching user stats:`, error);
    return {
      reportsSubmitted: 0,
      reportsVerified: 0,
      daysActive: 0
    };
  }
}