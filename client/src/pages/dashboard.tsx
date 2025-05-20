import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from '@/hooks/use-i18n';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from '@tanstack/react-query';

// Types for achievements and user stats
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

interface UserStats {
  reportsSubmitted: number;
  reportsVerified: number;
  daysActive: number;
  lastReport?: Date;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [_, navigate] = useLocation();

  // Query for fetching user achievements
  const { data: achievements, isLoading: achievementsLoading } = useQuery<Achievement[]>({
    queryKey: ['/api/user/achievements'],
    enabled: !!user, // Only run query if user is logged in
  });

  // Query for fetching user stats
  const { data: stats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ['/api/user/stats'],
    enabled: !!user, // Only run query if user is logged in
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && !achievementsLoading && !statsLoading) {
      navigate('/login');
    }
  }, [user, navigate, achievementsLoading, statsLoading]);

  if (!user && !achievementsLoading && !statsLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">{t('loginRequired')}</h2>
        <p className="text-gray-600 mb-4">{t('pleaseLoginToAccessDashboard')}</p>
        <button 
          onClick={() => navigate('/login')}
          className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-600 transition-colors"
        >
          {t('login')}
        </button>
      </div>
    </div>;
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-10">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col items-start mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('dashboard')}</h1>
          <p className="text-gray-600">{t('dashboardDescription')}</p>
        </div>

        {/* User profile summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="col-span-1">
            <CardHeader className="pb-2">
              <CardTitle>{t('profile')}</CardTitle>
              <CardDescription>{t('yourProfile')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{user?.username}</h3>
                  <p className="text-gray-500">{user?.email}</p>
                  <p className="text-sm text-gray-400">{t('memberSince')}: {user?.trialStartDate ? new Date(user.trialStartDate).toLocaleDateString() : '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader className="pb-2">
              <CardTitle>{t('activity')}</CardTitle>
              <CardDescription>{t('yourActivity')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {statsLoading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span>{t('reportsSubmitted')}:</span>
                    <span className="font-semibold">{stats?.reportsSubmitted || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{t('reportsVerified')}:</span>
                    <span className="font-semibold">{stats?.reportsVerified || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{t('daysActive')}:</span>
                    <span className="font-semibold">{stats?.daysActive || 0}</span>
                  </div>
                  {stats?.lastReport && (
                    <div className="flex justify-between items-center">
                      <span>{t('lastReport')}:</span>
                      <span className="font-semibold">{new Date(stats.lastReport).toLocaleDateString()}</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
          
          <Card className="col-span-1">
            <CardHeader className="pb-2">
              <CardTitle>{t('subscription')}</CardTitle>
              <CardDescription>{t('subscriptionStatus')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span>{t('status')}:</span>
                <Badge variant={user?.subscribed ? "default" : "outline"}>
                  {user?.subscribed ? t('active') : t('freeTrial')}
                </Badge>
              </div>
              {!user?.subscribed && (
                <>
                  <div className="flex justify-between items-center">
                    <span>{t('daysLeft')}:</span>
                    <span className="font-semibold">{t('daysValue', { count: 30 })}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span>{t('trialProgress')}</span>
                      <span>0/30</span>
                    </div>
                    <Progress value={0} className="h-2" />
                  </div>
                </>
              )}
            </CardContent>
            {!user?.subscribed && (
              <CardFooter>
                <button className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary-600 transition-colors">
                  {t('upgrade')}
                </button>
              </CardFooter>
            )}
          </Card>
        </div>

        {/* Achievements section */}
        <Tabs defaultValue="all" className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h2 className="text-2xl font-bold">{t('achievements')}</h2>
              <p className="text-gray-600">{t('achievementsDescription')}</p>
            </div>
            <TabsList>
              <TabsTrigger value="all">{t('all')}</TabsTrigger>
              <TabsTrigger value="unlocked">{t('unlocked')}</TabsTrigger>
              <TabsTrigger value="locked">{t('locked')}</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievementsLoading ? (
                Array(6).fill(0).map((_, i) => (
                  <Card key={i} className="bg-gray-100 overflow-hidden">
                    <div className="h-40 animate-pulse bg-gray-200"></div>
                  </Card>
                ))
              ) : achievements?.length ? (
                achievements.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))
              ) : (
                <div className="col-span-full text-center py-10">
                  <p className="text-gray-500">{t('noAchievements')}</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="unlocked" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievementsLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <Card key={i} className="bg-gray-100 overflow-hidden">
                    <div className="h-40 animate-pulse bg-gray-200"></div>
                  </Card>
                ))
              ) : achievements?.filter(a => a.unlocked)?.length ? (
                achievements
                  .filter(achievement => achievement.unlocked)
                  .map((achievement) => (
                    <AchievementCard key={achievement.id} achievement={achievement} />
                  ))
              ) : (
                <div className="col-span-full text-center py-10">
                  <p className="text-gray-500">{t('noUnlockedAchievements')}</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="locked" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievementsLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <Card key={i} className="bg-gray-100 overflow-hidden">
                    <div className="h-40 animate-pulse bg-gray-200"></div>
                  </Card>
                ))
              ) : achievements?.filter(a => !a.unlocked)?.length ? (
                achievements
                  .filter(achievement => !achievement.unlocked)
                  .map((achievement) => (
                    <AchievementCard key={achievement.id} achievement={achievement} />
                  ))
              ) : (
                <div className="col-span-full text-center py-10">
                  <p className="text-gray-500">{t('allAchievementsUnlocked')}</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Achievement card component
function AchievementCard({ achievement }: { achievement: Achievement }) {
  const { t } = useTranslation();
  
  return (
    <Card className={`overflow-hidden ${achievement.unlocked ? 'border-primary' : 'opacity-75'}`}>
      <div className={`h-24 flex items-center justify-center text-4xl ${achievement.unlocked ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
        <div dangerouslySetInnerHTML={{ __html: achievement.icon }} />
      </div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{achievement.name}</CardTitle>
          {achievement.unlocked && (
            <Badge variant="default" className="ml-2">
              {t('unlocked')}
            </Badge>
          )}
        </div>
        <CardDescription>{achievement.description}</CardDescription>
      </CardHeader>
      {!achievement.unlocked && achievement.maxProgress > 0 && (
        <CardContent className="pb-4">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span>{t('progress')}</span>
              <span>{achievement.progress}/{achievement.maxProgress}</span>
            </div>
            <Progress value={(achievement.progress / achievement.maxProgress) * 100} className="h-2" />
          </div>
        </CardContent>
      )}
    </Card>
  );
}