import React, { useState, useEffect } from 'react';
import { StyleSheet, Pressable, View, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShifts } from '@/context/ShiftContext';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, formatTime, getElapsedTimeString, formatDuration } from '@/utils/dateHelpers';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ClockScreen() {
  const { currentShiftStartTime, clockIn, clockOut, shifts, isLoading } = useShifts();
  const theme = useTheme();
  
  // States for ticking
  const [currentTime, setCurrentTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  // Update current time & elapsed shift timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      if (currentShiftStartTime) {
        setElapsedTime(getElapsedTimeString(currentShiftStartTime));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentShiftStartTime]);

  // If clock in time is set, initialize elapsed time immediately
  useEffect(() => {
    if (currentShiftStartTime) {
      setElapsedTime(getElapsedTimeString(currentShiftStartTime));
    } else {
      setElapsedTime('00:00:00');
    }
  }, [currentShiftStartTime]);

  // Calculate stats
  const clockedIn = !!currentShiftStartTime;
  
  // Calculate total hours this week
  const getWeeklyHours = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return shifts
      .filter(shift => new Date(shift.startTime) >= oneWeekAgo)
      .reduce((sum, shift) => sum + shift.durationHours, 0);
  };

  const weeklyHours = getWeeklyHours();

  const handleClockAction = async () => {
    if (clockedIn) {
      await clockOut();
    } else {
      await clockIn();
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText type="small" style={styles.appSubtitle}>WAITER ASSISTANT</ThemedText>
            <ThemedText type="subtitle" style={styles.appTitle}>Apron</ThemedText>
          </View>
          <View style={styles.statusBadge}>
            <View style={[
              styles.statusDot, 
              { backgroundColor: clockedIn ? theme.success : theme.textSecondary }
            ]} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {clockedIn ? 'Active Shift' : 'Off Clock'}
            </ThemedText>
          </View>
        </View>

        {/* Clock/Time Display */}
        <View style={styles.clockSection}>
          <ThemedText style={styles.liveDate}>{formatDate(currentTime.toISOString())}</ThemedText>
          <ThemedText style={styles.liveClock}>
            {currentTime.toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
            })}
          </ThemedText>
        </View>

        {/* Main Clock Action Widget */}
        <View style={styles.mainWidget}>
          {clockedIn ? (
            <View style={styles.timerContainer}>
              <ThemedText type="small" style={styles.timerLabel}>SHIFT DURATION</ThemedText>
              <ThemedText style={[styles.timerValue, { color: theme.primary }]}>{elapsedTime}</ThemedText>
              <ThemedText type="small" style={styles.startTimeLabel}>
                Started at {formatTime(currentShiftStartTime!)}
              </ThemedText>
            </View>
          ) : (
            <View style={styles.timerContainer}>
              <ThemedText type="small" style={styles.timerLabel}>READY TO WORK</ThemedText>
              <ThemedText style={styles.timerValuePlaceholder}>00:00:00</ThemedText>
              <ThemedText type="small" style={styles.startTimeLabel}>
                Tap below to start tracking
              </ThemedText>
            </View>
          )}

          {/* Clock In / Out Button */}
          <View style={styles.buttonOuterWrapper}>
            <Pressable
              onPress={handleClockAction}
              style={({ pressed }) => [
                styles.clockButton,
                {
                  backgroundColor: clockedIn ? theme.error : theme.primary,
                  borderColor: clockedIn ? theme.error : theme.primary,
                  shadowColor: clockedIn ? theme.error : theme.primary,
                  opacity: pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.96 : 1 }]
                }
              ]}
            >
              <Ionicons 
                name={clockedIn ? "exit-outline" : "play-outline"} 
                size={40} 
                color="#FFFFFF" 
              />
              <ThemedText style={styles.clockButtonText}>
                {clockedIn ? 'Clock Out' : 'Clock In'}
              </ThemedText>
            </Pressable>
          </View>
        </View>

        {/* Weekly Summary Card */}
        <View style={styles.summarySection}>
          <ThemedView type="backgroundElement" style={[styles.summaryCard, { borderColor: theme.cardBorder }]}>
            <View style={styles.summaryIconWrapper}>
              <Ionicons name="time-outline" size={24} color={theme.primary} />
            </View>
            <View style={styles.summaryTextWrapper}>
              <ThemedText type="small" style={styles.summaryLabel}>PAST 7 DAYS</ThemedText>
              <ThemedText type="subtitle" style={styles.summaryValue}>
                {formatDuration(weeklyHours)}
              </ThemedText>
            </View>
          </ThemedView>
        </View>

      </SafeAreaView>
    </ThemedView>
  );
}

const { width } = Dimensions.get('window');
const buttonSize = width * 0.44;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    opacity: 0.7,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: 20,
    gap: Spacing.one,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  clockSection: {
    alignItems: 'center',
    marginVertical: Spacing.three,
  },
  liveDate: {
    fontSize: 16,
    opacity: 0.8,
    fontWeight: '600',
  },
  liveClock: {
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: Spacing.one,
  },
  mainWidget: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: Spacing.four,
  },
  timerContainer: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  timerLabel: {
    fontSize: 12,
    letterSpacing: 1,
    fontWeight: '700',
    opacity: 0.6,
  },
  timerValue: {
    fontSize: 54,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  timerValuePlaceholder: {
    fontSize: 54,
    fontWeight: 'bold',
    opacity: 0.25,
    fontVariant: ['tabular-nums'],
  },
  startTimeLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  buttonOuterWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockButton: {
    width: buttonSize,
    height: buttonSize,
    borderRadius: buttonSize / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    elevation: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    gap: Spacing.one,
  },
  clockButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  summarySection: {
    width: '100%',
    marginTop: Spacing.three,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    gap: Spacing.three,
  },
  summaryIconWrapper: {
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryTextWrapper: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    opacity: 0.6,
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
});
