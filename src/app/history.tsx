import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, Pressable, View, Alert, Dimensions, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShifts, Shift } from '@/context/ShiftContext';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { formatDateShort, formatTime, formatDuration } from '@/utils/dateHelpers';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';

export default function HistoryScreen() {
  const { shifts, deleteShift, clearAllShifts, updateShift } = useShifts();
  const theme = useTheme();
  const params = useLocalSearchParams<{ week?: string }>();

  // Week Calculation Helpers
  const getWeekStart = (isoString: string) => {
    const date = new Date(isoString);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(date.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const [selectedWeek, setSelectedWeek] = useState<string | null>(() => {
    if (params.week === 'current') {
      return getWeekStart(new Date().toISOString()).toISOString();
    }
    return null;
  });
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  useEffect(() => {
    if (params.week === 'current') {
      setSelectedWeek(getWeekStart(new Date().toISOString()).toISOString());
    }
  }, [params.week]);

  // Edit State
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [editDate, setEditDate] = useState<Date>(new Date());
  const [editStartTime, setEditStartTime] = useState<Date>(new Date());
  const [editEndTime, setEditEndTime] = useState<Date>(new Date());
  const [editTips, setEditTips] = useState<string>('');
  const [activePicker, setActivePicker] = useState<'date' | 'start' | 'end' | null>(null);

  const getWeekLabel = (start: Date) => {
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${formatDateShort(start.toISOString())} - ${formatDateShort(end.toISOString())}`;
  };

  // Get available weeks
  const availableWeeksMap = new Map<string, string>();
  shifts.forEach(shift => {
    const start = getWeekStart(shift.startTime);
    const startIso = start.toISOString();
    if (!availableWeeksMap.has(startIso)) {
      availableWeeksMap.set(startIso, getWeekLabel(start));
    }
  });

  const availableWeeks = Array.from(availableWeeksMap.entries())
    .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());

  // Filter Shifts
  const filteredShifts = selectedWeek 
    ? shifts.filter(shift => getWeekStart(shift.startTime).toISOString() === selectedWeek)
    : shifts;

  // Calculations
  const totalShifts = filteredShifts.length;
  const totalHours = filteredShifts.reduce((sum, shift) => sum + shift.durationHours, 0);
  const totalTips = filteredShifts.reduce((sum, shift) => sum + (shift.tips || 0), 0);

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

  const openEditModal = (shift: Shift) => {
    setEditingShift(shift);
    setEditDate(new Date(shift.startTime));
    setEditStartTime(new Date(shift.startTime));
    setEditEndTime(new Date(shift.endTime));
    setEditTips(shift.tips !== undefined ? shift.tips.toString() : '');
  };

  const closeEditModal = () => {
    setEditingShift(null);
    setActivePicker(null);
  };

  const handleEditSave = async () => {
    if (!editingShift) return;
    
    const finalStart = new Date(editDate);
    finalStart.setHours(editStartTime.getHours(), editStartTime.getMinutes(), 0, 0);

    const finalEnd = new Date(editDate);
    finalEnd.setHours(editEndTime.getHours(), editEndTime.getMinutes(), 0, 0);
    
    if (finalEnd.getTime() <= finalStart.getTime()) {
      finalEnd.setDate(finalEnd.getDate() + 1);
    }

    const duration = (finalEnd.getTime() - finalStart.getTime()) / (1000 * 60 * 60);
    if (duration <= 0) {
      Alert.alert('Invalid Shift', 'The total duration must be greater than 0.');
      return;
    }
    if (duration > 24) {
      Alert.alert('Invalid Shift', 'Total tracked hours for a single day cannot exceed 24 hours.');
      return;
    }

    const success = await updateShift(editingShift.id, {
      startTime: finalStart.toISOString(),
      endTime: finalEnd.toISOString(),
      tips: parseFloat(editTips) || 0,
    });

    if (success) {
      closeEditModal();
    } else {
      Alert.alert('Error', 'Failed to update shift.');
    }
  };

  const onPickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      const currentPicker = activePicker;
      setActivePicker(null);
      if (!selectedDate) return;
      if (currentPicker === 'date') setEditDate(selectedDate);
      if (currentPicker === 'start') setEditStartTime(selectedDate);
      if (currentPicker === 'end') setEditEndTime(selectedDate);
    } else {
      if (!selectedDate) return;
      if (activePicker === 'date') setEditDate(selectedDate);
      if (activePicker === 'start') setEditStartTime(selectedDate);
      if (activePicker === 'end') setEditEndTime(selectedDate);
    }
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
          <View style={{ flexDirection: 'row', gap: Spacing.two }}>
            <Pressable 
              onPress={() => openEditModal(item)}
              style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Ionicons name="pencil" size={20} color={theme.primary} />
            </Pressable>
            <Pressable 
              onPress={() => handleDelete(item.id, item.startTime)}
              style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Ionicons name="trash-outline" size={20} color={theme.error} />
            </Pressable>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
            <ThemedText style={styles.timeRangeText}>
              {formatTime(item.startTime)} – {formatTime(item.endTime)}
            </ThemedText>
          </View>
          <View style={styles.rightDetails}>
            {item.tips !== undefined && item.tips > 0 && (
              <ThemedText style={[styles.tipsValue, { color: theme.success }]}>
                +${item.tips.toFixed(2)}
              </ThemedText>
            )}
            <View style={{ alignItems: 'flex-end' }}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>Duration</ThemedText>
              <ThemedText style={[styles.durationValue, { color: theme.primary }]}>
                {formatDuration(item.durationHours)}
              </ThemedText>
            </View>
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
            <Pressable 
              onPress={() => setFilterModalVisible(true)}
              style={({ pressed }) => [
                styles.filterBtn, 
                { opacity: pressed ? 0.7 : 1, borderColor: theme.cardBorder }
              ]}
            >
              <Ionicons name="filter" size={14} color={theme.text} />
              <ThemedText type="smallBold">
                {selectedWeek ? 'Filtered' : 'All Time'}
              </ThemedText>
            </Pressable>
            {shifts.length > 0 && (
              <Pressable 
                onPress={handleClearAll} 
                style={({ pressed }) => [styles.clearBtn, { opacity: pressed ? 0.7 : 1 }]}
              >
                <ThemedText type="smallBold" style={{ color: theme.error }}>Reset</ThemedText>
              </Pressable>
            )}
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsHeader}>
          <ThemedText style={styles.statsTitle}>
            {selectedWeek ? availableWeeksMap.get(selectedWeek) : 'All Time'}
          </ThemedText>
        </View>
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
          <ThemedView type="backgroundElement" style={[styles.statBox, { borderColor: theme.cardBorder }]}>
            <ThemedText type="small" style={styles.statLabel}>TOTAL TIPS</ThemedText>
            <ThemedText style={[styles.statValue, { color: theme.success }]}>
              ${totalTips.toFixed(2)}
            </ThemedText>
          </ThemedView>
        </View>

        {/* List of Shifts */}
        <FlatList
          data={filteredShifts}
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

        {/* Filter Modal */}
        <Modal
          visible={filterModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setFilterModalVisible(false)}>
            <Pressable 
              style={[styles.filterModalContent, { backgroundColor: theme.background, borderColor: theme.cardBorder }]}
              onPress={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
              <ThemedText style={styles.modalTitle}>Filter by Week</ThemedText>
              
              <FlatList
                data={[{ id: null, label: 'All Time' }, ...availableWeeks.map(([id, label]) => ({ id, label }))]}
                keyExtractor={item => item.id || 'all'}
                renderItem={({ item }) => (
                  <Pressable
                    style={[
                      styles.filterOption, 
                      selectedWeek === item.id && { backgroundColor: 'rgba(128,128,128,0.1)' }
                    ]}
                    onPress={() => {
                      setSelectedWeek(item.id);
                      setFilterModalVisible(false);
                    }}
                  >
                    <ThemedText style={selectedWeek === item.id ? { fontWeight: 'bold' } : {}}>
                      {item.label}
                    </ThemedText>
                    {selectedWeek === item.id && (
                      <Ionicons name="checkmark" size={20} color={theme.primary} />
                    )}
                  </Pressable>
                )}
                contentContainerStyle={{ paddingVertical: Spacing.two }}
              />
              <Pressable 
                style={styles.closeModalBtn}
                onPress={() => setFilterModalVisible(false)}
              >
                <ThemedText type="smallBold" style={{ color: theme.textSecondary }}>Close</ThemedText>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Edit Modal */}
        <Modal
          visible={!!editingShift}
          transparent
          animationType="slide"
          onRequestClose={closeEditModal}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <View style={[styles.editModalContent, { backgroundColor: theme.background, borderColor: theme.cardBorder }]}>
              <View style={styles.editModalHeader}>
                <ThemedText style={styles.modalTitle}>Edit Shift</ThemedText>
                <Pressable onPress={closeEditModal}>
                  <Ionicons name="close" size={24} color={theme.textSecondary} />
                </Pressable>
              </View>

              <View style={styles.formRow}>
                <ThemedText style={styles.formLabel}>Date</ThemedText>
                <Pressable
                  onPress={() => setActivePicker('date')}
                  style={[styles.selectorButton, { borderColor: theme.cardBorder }]}
                >
                  <ThemedText>{formatDateShort(editDate.toISOString())}</ThemedText>
                  <Ionicons name="calendar-outline" size={18} color={theme.textSecondary} />
                </Pressable>
              </View>

              <View style={styles.timeInputsRow}>
                <View style={styles.timeCol}>
                  <ThemedText style={styles.formLabel}>Start Time</ThemedText>
                  <Pressable
                    onPress={() => setActivePicker('start')}
                    style={[styles.selectorButton, { borderColor: theme.cardBorder }]}
                  >
                    <ThemedText>{formatTime(editStartTime.toISOString())}</ThemedText>
                  </Pressable>
                </View>

                <View style={styles.timeCol}>
                  <ThemedText style={styles.formLabel}>End Time</ThemedText>
                  <Pressable
                    onPress={() => setActivePicker('end')}
                    style={[styles.selectorButton, { borderColor: theme.cardBorder }]}
                  >
                    <ThemedText>{formatTime(editEndTime.toISOString())}</ThemedText>
                  </Pressable>
                </View>
              </View>

              <View style={styles.formRow}>
                <ThemedText style={styles.formLabel}>Tips Earned</ThemedText>
                <View style={styles.tipInputContainer}>
                  <ThemedText style={styles.currencySymbol}>$</ThemedText>
                  <TextInput
                    style={[styles.tipInput, { color: theme.text }]}
                    value={editTips}
                    onChangeText={setEditTips}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
              </View>

              <Pressable 
                style={[styles.saveButton, { backgroundColor: theme.primary }]} 
                onPress={handleEditSave}
              >
                <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
              </Pressable>
            </View>
          </KeyboardAvoidingView>

          {activePicker && (
            <DateTimePicker
              value={
                activePicker === 'date' ? editDate :
                activePicker === 'start' ? editStartTime :
                editEndTime
              }
              mode={activePicker === 'date' ? 'date' : 'time'}
              display="default"
              onChange={onPickerChange}
              maximumDate={activePicker === 'date' ? new Date() : undefined}
            />
          )}
        </Modal>

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
  statsHeader: {
    marginBottom: Spacing.two,
    paddingHorizontal: Spacing.one,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    opacity: 0.8,
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
  actionBtn: {
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
  rightDetails: {
    alignItems: 'flex-end',
    gap: Spacing.one,
  },
  tipsValue: {
    fontSize: 14,
    fontWeight: 'bold',
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
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
    gap: Spacing.one,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  filterModalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: Spacing.three,
    padding: Spacing.four,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: Spacing.three,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
  },
  closeModalBtn: {
    alignItems: 'center',
    marginTop: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },
  editModalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: Spacing.three,
    padding: Spacing.four,
    borderWidth: 1,
    gap: Spacing.three,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  formRow: {
    gap: Spacing.one,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    opacity: 0.7,
    letterSpacing: 0.5,
  },
  selectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  timeInputsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  timeCol: {
    flex: 1,
    gap: Spacing.one,
  },
  tipInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.05)',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: Spacing.one,
    opacity: 0.7,
  },
  tipInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    marginTop: Spacing.two,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
