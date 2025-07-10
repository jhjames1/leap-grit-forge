import { usePWA } from '@/hooks/usePWA';
import { Card } from '@/components/ui/card';
import { WifiOff, Wifi } from 'lucide-react';

const OfflineIndicator = () => {
  const { isOnline } = usePWA();

  if (isOnline) {
    return null;
  }

  return (
    <Card className="fixed top-4 left-4 right-4 z-50 p-3 bg-orange-50 border-orange-200">
      <div className="flex items-center space-x-2">
        <WifiOff className="text-orange-600" size={16} />
        <div className="flex-1">
          <p className="text-sm font-medium text-orange-800">
            You're offline
          </p>
          <p className="text-xs text-orange-600">
            Don't worry! LEAP works offline. Your progress is saved locally.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default OfflineIndicator;