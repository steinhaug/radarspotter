import { useEffect } from 'react';
import Map from '@/components/Map';
import TopBar from '@/components/TopBar';
import ReportButton from '@/components/ReportButton';
import TrialIndicator from '@/components/TrialIndicator';
import BottomSheet from '@/components/BottomSheet';
import MapControls from '@/components/MapControls';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-i18n';

export default function Home() {
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const showReportSuccess = (event: CustomEvent) => {
      toast({
        description: t('reportSuccess'),
        className: "bg-dark text-white",
      });
    };

    // Add event listener for custom event
    window.addEventListener('radarReported' as any, showReportSuccess);

    return () => {
      window.removeEventListener('radarReported' as any, showReportSuccess);
    };
  }, [toast, t]);

  return (
    <div className="h-screen w-full relative overflow-hidden">
      <Map />
      <TopBar />
      <TrialIndicator />
      <ReportButton />
      <BottomSheet />
      <MapControls />
    </div>
  );
}
