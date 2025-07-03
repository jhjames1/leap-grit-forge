
import { useState, useEffect } from 'react';
import { RecoveryStrengthData, getInitialRecoveryStrength, updateRecoveryStrength, trackAction } from '@/utils/recoveryStrength';

export const useRecoveryStrength = () => {
  const [strengthData, setStrengthData] = useState<RecoveryStrengthData>(() => {
    const saved = localStorage.getItem('recoveryStrength');
    return saved ? JSON.parse(saved) : getInitialRecoveryStrength();
  });

  useEffect(() => {
    localStorage.setItem('recoveryStrength', JSON.stringify(strengthData));
  }, [strengthData]);

  const logAction = (actionType: string) => {
    const actionMapping = trackAction(actionType);
    if (actionMapping) {
      const updatedData = updateRecoveryStrength(
        strengthData,
        actionType.replace('_', ' ').toLowerCase(),
        actionMapping.domain,
        actionMapping.change
      );
      setStrengthData(updatedData);
    }
  };

  const getStrengthData = () => strengthData;

  return {
    strengthData,
    logAction,
    getStrengthData
  };
};
