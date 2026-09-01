import { useState, useEffect } from 'react';
import { getStoreStatus, StoreStatus } from '../utils/storeHours';

export const useStoreStatus = (): StoreStatus => {
  const [status, setStatus] = useState<StoreStatus>(() => getStoreStatus());

  useEffect(() => {
    const update = () => {
      setStatus(getStoreStatus());
    };

    update();
    const interval = setInterval(update, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return status;
};
