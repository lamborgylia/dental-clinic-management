import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { clinicApi } from '../services/clinicApi';
import type { Clinic } from '../services/clinicApi';
import { authService } from '../services/auth';

interface ClinicContextType {
  clinic: Clinic | null;
  loading: boolean;
  error: string | null;
  refreshClinic: () => Promise<void>;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (context === undefined) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
};

interface ClinicProviderProps {
  children: ReactNode;
}

export const ClinicProvider: React.FC<ClinicProviderProps> = ({ children }) => {
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClinic = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const user = authService.getUser();
      if (!user) {
        setClinic(null);
        return;
      }

      const clinicData = await clinicApi.getCurrentClinic();
      setClinic(clinicData);
    } catch (err: any) {
      console.error('Ошибка загрузки клиники:', err);
      setError(err.response?.data?.detail || 'Ошибка загрузки информации о клинике');
      setClinic(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshClinic = async () => {
    await fetchClinic();
  };

  useEffect(() => {
    fetchClinic();
  }, []);

  const value: ClinicContextType = {
    clinic,
    loading,
    error,
    refreshClinic
  };

  return (
    <ClinicContext.Provider value={value}>
      {children}
    </ClinicContext.Provider>
  );
};
