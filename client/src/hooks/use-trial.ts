import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface TrialInfo {
  daysLeft: number;
  isSubscribed: boolean;
  trialStartDate: string;
}

export function useTrial() {
  // Query for user's trial status
  const { data, isLoading, error } = useQuery<TrialInfo>({
    queryKey: ['/api/user/trial-status'],
  });

  // Default trial duration in days
  const TRIAL_DURATION = 30;

  // Calculate days left
  const daysLeft = data?.daysLeft ?? calculateDaysLeft(data?.trialStartDate, TRIAL_DURATION);
  const isSubscribed = data?.isSubscribed ?? false;

  function calculateDaysLeft(startDateStr?: string, duration = TRIAL_DURATION): number {
    if (!startDateStr) {
      // If we don't have a start date, assume the trial just started
      return duration;
    }

    const startDate = new Date(startDateStr);
    const currentDate = new Date();
    
    // Calculate the difference in milliseconds
    const differenceMs = startDate.getTime() + (duration * 24 * 60 * 60 * 1000) - currentDate.getTime();
    
    // Convert to days and round
    const daysRemaining = Math.ceil(differenceMs / (24 * 60 * 60 * 1000));
    
    // Make sure we don't return negative days
    return Math.max(0, daysRemaining);
  }

  return {
    daysLeft,
    isSubscribed,
    isLoading,
    error,
  };
}
