import { useTranslation } from '@/hooks/use-i18n';
import { useTrial } from '@/hooks/use-trial';

export default function TrialIndicator() {
  const { t } = useTranslation();
  const { daysLeft } = useTrial();

  return (
    <div className="absolute top-16 right-4 bg-white bg-opacity-90 px-3 py-1 rounded-full shadow-sm flex items-center z-20">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-accent mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-xs font-medium">
        {daysLeft === 1
          ? t('dayLeft', { count: daysLeft })
          : t('daysLeft', { count: daysLeft })}
      </span>
    </div>
  );
}
