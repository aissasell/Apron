import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ScheduledShift {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // ISO String
  endTime: string;   // ISO String
}

export interface Schedule {
  id: string;
  startDate: string; // YYYY-MM-DD
  shifts: ScheduledShift[];
}

interface ScheduleContextType {
  schedules: Schedule[];
  isLoading: boolean;
  addSchedule: (startDate: string, initialShifts: Omit<ScheduledShift, 'id'>[]) => Promise<string | null>;
  updateSchedule: (id: string, updatedData: Partial<Schedule>) => Promise<boolean>;
  deleteSchedule: (id: string) => Promise<void>;
  addShiftToSchedule: (scheduleId: string, shift: Omit<ScheduledShift, 'id'>) => Promise<boolean>;
  updateShiftInSchedule: (scheduleId: string, shiftId: string, updatedData: Partial<ScheduledShift>) => Promise<boolean>;
  deleteShiftFromSchedule: (scheduleId: string, shiftId: string) => Promise<boolean>;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

const STORAGE_KEYS = {
  SCHEDULES: '@apron_schedules',
};

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const storedSchedules = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULES);
        if (storedSchedules) {
          setSchedules(JSON.parse(storedSchedules));
        }
      } catch (error) {
        console.error('Failed to load schedules from storage', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const saveSchedules = async (updatedSchedules: Schedule[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(updatedSchedules));
      setSchedules(updatedSchedules);
    } catch (error) {
      console.error('Failed to save schedules', error);
    }
  };

  const addSchedule = async (startDate: string, initialShifts: Omit<ScheduledShift, 'id'>[]) => {
    try {
      const newSchedule: Schedule = {
        id: Math.random().toString(36).substring(2, 9),
        startDate,
        shifts: initialShifts.map(shift => ({ ...shift, id: Math.random().toString(36).substring(2, 9) })),
      };
      
      const updatedSchedules = [newSchedule, ...schedules].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      await saveSchedules(updatedSchedules);
      return newSchedule.id;
    } catch (error) {
      console.error('Failed to add schedule', error);
      return null;
    }
  };

  const updateSchedule = async (id: string, updatedData: Partial<Schedule>) => {
    try {
      let isUpdated = false;
      const updatedSchedules = schedules.map(sched => {
        if (sched.id === id) {
          isUpdated = true;
          return { ...sched, ...updatedData };
        }
        return sched;
      });

      if (isUpdated) {
        updatedSchedules.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        await saveSchedules(updatedSchedules);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update schedule', error);
      return false;
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      const updatedSchedules = schedules.filter((s) => s.id !== id);
      await saveSchedules(updatedSchedules);
    } catch (error) {
      console.error('Failed to delete schedule', error);
    }
  };

  const addShiftToSchedule = async (scheduleId: string, shift: Omit<ScheduledShift, 'id'>) => {
    try {
      let isUpdated = false;
      const updatedSchedules = schedules.map(sched => {
        if (sched.id === scheduleId) {
          isUpdated = true;
          return {
            ...sched,
            shifts: [...sched.shifts, { ...shift, id: Math.random().toString(36).substring(2, 9) }].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
          };
        }
        return sched;
      });

      if (isUpdated) {
        await saveSchedules(updatedSchedules);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to add shift to schedule', error);
      return false;
    }
  };

  const updateShiftInSchedule = async (scheduleId: string, shiftId: string, updatedData: Partial<ScheduledShift>) => {
    try {
      let isUpdated = false;
      const updatedSchedules = schedules.map(sched => {
        if (sched.id === scheduleId) {
          const newShifts = sched.shifts.map(s => {
            if (s.id === shiftId) {
              isUpdated = true;
              return { ...s, ...updatedData };
            }
            return s;
          });
          return {
            ...sched,
            shifts: newShifts.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
          };
        }
        return sched;
      });

      if (isUpdated) {
        await saveSchedules(updatedSchedules);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update shift in schedule', error);
      return false;
    }
  };

  const deleteShiftFromSchedule = async (scheduleId: string, shiftId: string) => {
    try {
      let isUpdated = false;
      const updatedSchedules = schedules.map(sched => {
        if (sched.id === scheduleId) {
          isUpdated = true;
          return {
            ...sched,
            shifts: sched.shifts.filter(s => s.id !== shiftId)
          };
        }
        return sched;
      });

      if (isUpdated) {
        await saveSchedules(updatedSchedules);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete shift from schedule', error);
      return false;
    }
  };

  return (
    <ScheduleContext.Provider
      value={{
        schedules,
        isLoading,
        addSchedule,
        updateSchedule,
        deleteSchedule,
        addShiftToSchedule,
        updateShiftInSchedule,
        deleteShiftFromSchedule,
      }}>
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedules = () => {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error('useSchedules must be used within a ScheduleProvider');
  }
  return context;
};
