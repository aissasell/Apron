import React from 'react';
import { StyleSheet, FlatList, Pressable, View, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShifts, Shift } from '@/context/ShiftContext';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { formatDateShort, formatTime, formatDuration } from '@/utils/dateHelpers';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function HistoryScreen() {
  const { shifts, deleteShift, clearAllShifts } = useShifts();
  const theme = useTheme();

  // Calculations
  const totalShifts = shifts.length;
  const totalHours = shifts.reduce((sum, shift) => sum + shift.durationHours, 0);

  const handleDelete = (id: string, dateStr: string) => {
    Alert.alert(
      'Delete Shift',
      `Are you sure you want to delete the shift on ${formatDateShort(dateStr)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteShift(id)
        },
      ]
    );
  };

  const handleClearAll = () => {
    if (shifts.length === 0) return;
    Alert.alert(
      'Reset All Shifts',
      'This will permanently delete all shift history. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: () => clearAllShifts()
        },
      ]
    );
  };

  const renderShiftItem = ({ item }: { item: Shift }) => {
    return (
      <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.cardBorder }]}>
        <View style={styles.cardHeader}>
          <View style={styles.dateAndBadge}>
            <ThemedText style={styles.shiftDate}>{formatDateShort(item.startTime)}</ThemedText>
            <View style={[
              styles.typeBadge,
              { backgroundColor: item.isManual ? 'rgba(255, 140, 0, 0.15)' : 'rgba(76, 175, 80, 0.15)' }
            ]}>
              <ThemedText style={[
                styles.typeBadgeText,
                { color: item.isManual ? theme.primary : theme.success }
              ]}>
                {item.isManual ? 'Manual' : 'Clocked'}
              </ThemedText>
            </View>
          </View>
          <Pressable 
            onPress={() => handleDelete(item.id, item.startTime)}
            style={({ pressed }) => [styles.deleteBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name="trash-outline" size={20} color={theme.error} />
          </Pressable>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
            <ThemedText style={styles.timeRangeText}>
              {formatTime(item.startTime)} – {formatTime(item.endTime)}
            </ThemedText>
          </View>
          <View style={styles.durationWrapper}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>Duration</ThemedText>
            <ThemedText style={[styles.durationValue, { color: theme.primary }]}>
              {formatDuration(item.durationHours)}
            </ThemedText>
          </View>
        </View>
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText type="small" style={styles.appSubtitle}>LOGGED HISTORY</ThemedText>
            <ThemedText type="subtitle" style={styles.appTitle}>Timesheet</ThemedText>
          </View>
          {shifts.length > 0 && (
            <Pressable 
              onPress={handleClearAll} 
              style={({ pressed }) => [styles.clearBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <ThemedText type="smallBold" style={{ color: theme.error }}>Reset</ThemedText>
            </Pressable>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <ThemedView type="backgroundElement" style={[styles.statBox, { borderColor: theme.cardBorder }]}>
            <ThemedText type="small" style={styles.statLabel}>TOTAL SHIFTS</ThemedText>
            <ThemedText style={styles.statValue}>{totalShifts}</ThemedText>
          </ThemedView>
          <ThemedView type="backgroundElement" style={[styles.statBox, { borderColor: theme.cardBorder }]}>
            <ThemedText type="small" style={styles.statLabel}>TOTAL HOURS</ThemedText>
            <ThemedText style={[styles.statValue, { color: theme.primary }]}>
              {formatDuration(totalHours)}
            </ThemedText>
          </ThemedView>
        </View>

        {/* List of Shifts */}
        <FlatList
          data={shifts}
          keyExtractor={(item) => item.id}
          renderItem={renderShiftItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconWrapper, { backgroundColor: theme.backgroundElement }]}>
                <Ionicons name="calendar-outline" size={48} color={theme.textSecondary} />
              </View>
              <ThemedText style={styles.emptyText}>No shifts logged yet</ThemedText>
              <ThemedText type="small" style={styles.emptySubtext}>
                Your clock-ins and manual shift logs will appear here.
              </ThemedText>
            </View>
          }
        />

      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
    marginBottom: Spacing.three,
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
  clearBtn: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  statBox: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    alignItems: 'center',
    gap: Spacing.one,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    opacity: 0.6,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  card: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateAndBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  shiftDate: {
    fontSize: 16,
    fontWeight: '700',
  },
  typeBadge: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.two,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  deleteBtn: {
    padding: Spacing.one,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128, 128, 128, 0.15)',
    paddingTop: Spacing.two,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  timeRangeText: {
    fontSize: 14,
    opacity: 0.8,
  },
  durationWrapper: {
    alignItems: 'flex-end',
  },
  durationValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    gap: Spacing.two,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptySubtext: {
    textAlign: 'center',
    opacity: 0.6,
    paddingHorizontal: Spacing.five,
  },
});
