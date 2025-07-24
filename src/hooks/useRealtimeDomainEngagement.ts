import { useState, useEffect } from 'react';
import { 
  realtimeDomainEngagement, 
  type DomainEngagementData, 
  type UserRiskData 
} from '@/services/realtimeDomainEngagement';

export const useRealtimeDomainEngagement = () => {
  const [domainData, setDomainData] = useState<DomainEngagementData | null>(null);
  const [userRiskData, setUserRiskData] = useState<UserRiskData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Subscribe to domain engagement updates
    const unsubscribeDomain = realtimeDomainEngagement.subscribeToDomainEngagement((data) => {
      setDomainData(data);
      setIsLoading(false);
    });

    // Subscribe to user risk updates
    const unsubscribeRisk = realtimeDomainEngagement.subscribeToUserRisk((data) => {
      setUserRiskData(data);
    });

    return () => {
      unsubscribeDomain();
      unsubscribeRisk();
    };
  }, []);

  return {
    domainData,
    userRiskData,
    isLoading
  };
};