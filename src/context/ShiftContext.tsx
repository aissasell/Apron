import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateDurationHours } from '@/utils/dateHelpers';

export interface Shift {
  id: string;
  startTime: string; // ISO String
  endTime: string;   // ISO String
  durationHours: number;
  isManual: boolean;
  tips?: number;
}

interface ShiftContextType {
  shifts: Shift[];
  currentShiftStartTime: string | null;
  isLoading: boolean;
  clockIn: () => Promise<void>;
  clockOut: (tips?: number) => Promise<void>;
  addManualShift: (startTime: string, endTime: string, tips?: number) => Promise<boolean>;
  addManualShifts: (shiftsData: {startTime: string, endTime: string, tips?: number}[]) => Promise<boolean>;
  updateShift: (id: string, updatedData: Partial<Shift>) => Promise<boolean>;
  deleteShift: (id: string) => Promise<void>;
  clearAllShifts: () => Promise<void>;
}

const ShiftContext = createContext<ShiftContextType | undefined>(undefined);

const STORAGE_KEYS = {
  SHIFTS: '@apron_shifts',
  CURRENT_SHIFT_START: '@apron_current_shift_start',
};

export const ShiftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [currentShiftStartTime, setCurrentShiftStartTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load shifts and active clock status on mount
  useEffect(() => {
    async function loadData() {
      try {
        const storedShifts = await AsyncStorage.getItem(STORAGE_KEYS.SHIFTS);
        const storedCurrentStart = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_SHIFT_START);

        if (storedShifts) {
          setShifts(JSON.parse(storedShifts));
        }
        if (storedCurrentStart) {
          setCurrentShiftStartTime(storedCurrentStart);
        }
      } catch (error) {
        console.error('Failed to load shifts from storage', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Save shifts helper
  const saveShifts = async (updatedShifts: Shift[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(updatedShifts));
      setShifts(updatedShifts);
    } catch (error) {
      console.error('Failed to save shifts', error);
    }
  };

  // Clock In
  const clockIn = async () => {
    try {
      const now = new Date().toISOString();
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_SHIFT_START, now);
      setCurrentShiftStartTime(now);
    } catch (error) {
      console.error('Failed to clock in', error);
    }
  };

  // Clock Out
  const clockOut = async (tips: number = 0) => {
    if (!currentShiftStartTime) return;
    try {
      const now = new Date().toISOString();
      const duration = calculateDurationHours(currentShiftStartTime, now);
      
      const newShift: Shift = {
        id: Math.random().toString(36).substring(2, 9),
        startTime: currentShiftStartTime,
        endTime: now,
        durationHours: duration,
        isManual: false,
        tips,
      };

      const updatedShifts = [newShift, ...shifts];
      await saveShifts(updatedShifts);
      
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_SHIFT_START);
      setCurrentShiftStartTime(null);
    } catch (error) {
      console.error('Failed to clock out', error);
    }
  };

  // Add Manual Shift
  const addManualShift = async (startTime: string, endTime: string, tips: number = 0): Promise<boolean> => {
    return addManualShifts([{ startTime, endTime, tips }]);
  };

  // Add Multiple Manual Shifts
  const addManualShifts = async (shiftsData: {startTime: string, endTime: string, tips?: number}[]): Promise<boolean> => {
    try {
      const newShifts = shiftsData.map(({startTime, endTime, tips}) => {
        const duration = calculateDurationHours(startTime, endTime);
        if (duration <= 0) return null;

        return {
          id: Math.random().toString(36).substring(2, 9),
          startTime,
          endTime,
          durationHours: duration,
          isManual: true,
          tips: tips || 0,
        };
      }).filter(Boolean) as Shift[];

      if (newShifts.length === 0) return false;

      const updatedShifts = [...newShifts, ...shifts].sort(
        (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
      await saveShifts(updatedShifts);
      return true;
    } catch (error) {
      console.error('Failed to add manual shifts', error);
      return false;
    }
  };

  // Update Shift
  const updateShift = async (id: string, updatedData: Partial<Shift>): Promise<boolean> => {
    try {
      let isUpdated = false;
      const updatedShifts = shifts.map(shift => {
        if (shift.id === id) {
          isUpdated = true;
          let durationHours = shift.durationHours;
          if (updatedData.startTime || updatedData.endTime) {
            durationHours = calculateDurationHours(
              updatedData.startTime || shift.startTime,
              updatedData.endTime || shift.endTime
            );
          }
          return {
            ...shift,
            ...updatedData,
            durationHours
          };
        }
        return shift;
      });

      if (isUpdated) {
        updatedShifts.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
        await saveShifts(updatedShifts);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update shift', error);
      return false;
    }
  };

  // Delete Shift
  const deleteShift = async (id: string) => {
    try {
      const updatedShifts = shifts.filter((shift) => shift.id !== id);
      await saveShifts(updatedShifts);
    } catch (error) {
      console.error('Failed to delete shift', error);
    }
  };

  // Clear all data (for reset)
  const clearAllShifts = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SHIFTS);
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_SHIFT_START);
      setShifts([]);
      setCurrentShiftStartTime(null);
    } catch (error) {
      console.error('Failed to clear shifts', error);
    }
  };

  return (
    <ShiftContext.Provider
      value={{
        shifts,
        currentShiftStartTime,
        isLoading,
        clockIn,
        clockOut,
        addManualShift,
        addManualShifts,
        updateShift,
        deleteShift,
        clearAllShifts,
      }}>
      {children}
    </ShiftContext.Provider>
  );
};

export const useShifts = () => {
  const context = useContext(ShiftContext);
  if (context === undefined) {
    throw new Error('useShifts must be used within a ShiftProvider');
  }
  return context;
};
