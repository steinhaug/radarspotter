import { useAppContext } from '@/contexts/AppContext';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useTranslation } from '@/hooks/use-i18n';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export default function ReportButton() {
  const { position } = useGeolocation();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isReporting, setIsReporting] = useState(false);

  const reportMutation = useMutation({
    mutationFn: async () => {
      if (!position) {
        throw new Error('Location is not available');
      }

      const { longitude, latitude } = position.coords;
      
      const res = await apiRequest('POST', '/api/radar-reports', {
        latitude,
        longitude,
      });
      
      return res.json();
    },
    onSuccess: () => {
      // Invalidate and refetch radar reports
      queryClient.invalidateQueries({ queryKey: ['/api/radar-reports'] });
      
      // Show success toast
      toast({
        description: t('reportSuccess'),
        className: "bg-dark text-white",
      });
      
      setIsReporting(false);
    },
    onError: (error) => {
      console.error('Failed to report radar:', error);
      
      toast({
        variant: "destructive",
        description: String(error),
      });
      
      setIsReporting(false);
    }
  });

  const handleReportRadar = () => {
    if (isReporting) return;
    
    setIsReporting(true);
    reportMutation.mutate();
  };

  return (
    <div className="absolute bottom-32 right-4 z-90">
      <button 
        className={`bg-primary text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center ${!isReporting && 'radar-pulse'} transition-all`}
        onClick={handleReportRadar}
        disabled={isReporting || !position}
        aria-label="Report radar"
      >
        {isReporting ? (
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="absolute -top-2 -right-2 text-xs bg-secondary text-white px-1 rounded-full">
              !
            </span>
          </div>
        )}
      </button>
    </div>
  );
}
