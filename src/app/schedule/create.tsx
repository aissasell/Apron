import React, { useState } from 'react';
import { StyleSheet, View, Pressable, ScrollView, TextInput, Platform, Alert, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useSchedules } from '@/context/ScheduleContext';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { formatDateShort, formatTime } from '@/utils/dateHelpers';

const getMondayOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const DAYS = [
  { label: 'Monday', offset: 0 },
  { label: 'Tuesday', offset: 1 },
  { label: 'Wednesday', offset: 2 },
  { label: 'Thursday', offset: 3 },
  { label: 'Friday', offset: 4 },
  { label: 'Saturday', offset: 5 },
  { label: 'Sunday', offset: 6 },
];

export default function CreateScheduleScreen() {
  const { addSchedule } = useSchedules();
  const theme = useTheme();
  const router = useRouter();

  // Generate a list of weeks for the dropdown (from 5 weeks ago to 15 weeks in the future)
  const availableWeeks = Array.from({ length: 20 }).map((_, i) => {
    const d = getMondayOfWeek(new Date());
    d.setDate(d.getDate() + (i - 5) * 7);
    return d;
  });

  const [selectedWeekMonday, setSelectedWeekMonday] = useState(() => getMondayOfWeek(new Date()));
  const [showWeekModal, setShowWeekModal] = useState(false);

  function createDefaultShift() {
    const sTime = new Date();
    sTime.setHours(9, 0, 0, 0);
    const eTime = new Date();
    eTime.setHours(17, 0, 0, 0);

    return {
      id: Math.random().toString(36).substring(2, 9),
      title: 'Waiter',
      dayOffset: 0,
      startTime: sTime,
      endTime: eTime,
    };
  }

  const [shifts, setShifts] = useState([createDefaultShift()]);
  
  const [showDayModalFor, setShowDayModalFor] = useState<string | null>(null);
  const [activePicker, setActivePicker] = useState<{ id: string; type: 'start' | 'end' } | null>(null);

  const onTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    if (Platform.OS === 'android') setActivePicker(null);
    if (selectedTime && activePicker) {
      setShifts(prev => prev.map(s => {
        if (s.id === activePicker.id) {
          if (activePicker.type === 'start') {
            return { ...s, startTime: selectedTime };
          } else if (activePicker.type === 'end') {
            return { ...s, endTime: selectedTime };
          }
        }
        return s;
      }));
    }
  };

  const addAnotherShift = () => {
    setShifts(prev => [...prev, createDefaultShift()]);
  };

  const removeShift = (id: string) => {
    setShifts(prev => prev.filter(s => s.id !== id));
  };

  const handleSave = async () => {
    if (shifts.length === 0) {
      Alert.alert('Error', 'Please add at least one shift to create a schedule.');
      return;
    }

    const formattedShifts = [];
    
    for (const shift of shifts) {
      if (!shift.title.trim()) {
        Alert.alert('Error', 'Please enter a title for all shifts.');
        return;
      }

      const shiftDate = new Date(selectedWeekMonday);
      shiftDate.setDate(shiftDate.getDate() + shift.dayOffset);

      const start = new Date(shiftDate);
      start.setHours(shift.startTime.getHours(), shift.startTime.getMinutes(), 0, 0);

      const end = new Date(shiftDate);
      end.setHours(shift.endTime.getHours(), shift.endTime.getMinutes(), 0, 0);

      if (end.getTime() <= start.getTime()) {
        end.setDate(end.getDate() + 1);
      }

      formattedShifts.push({
        title: shift.title,
        date: shiftDate.toISOString(),
        startTime: start.toISOString(),
        endTime: end.toISOString()
      });
    }

    const newScheduleId = await addSchedule(selectedWeekMonday.toISOString(), formattedShifts);

    if (newScheduleId) {
      router.replace(`/schedule/${newScheduleId}`);
    } else {
      Alert.alert('Error', 'Failed to create schedule.');
    }
  };

  const formatWeekRange = (monday: Date) => {
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    return `${formatDateShort(monday.toISOString())} - ${formatDateShort(sunday.toISOString())}`;
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={{ paddingRight: Spacing.three }}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <ThemedText type="small" style={styles.appSubtitle}>NEW SCHEDULE</ThemedText>
            <ThemedText type="subtitle" style={styles.appTitle}>Create</ThemedText>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Week Selector Container */}
          <ThemedView type="backgroundElement" style={[styles.formCard, { borderColor: theme.cardBorder }]}>
            <View style={styles.formRowHeader}>
              <Ionicons name="calendar" size={20} color={theme.primary} />
              <ThemedText style={styles.formRowTitle}>Schedule Week</ThemedText>
            </View>
            <Pressable
              onPress={() => setShowWeekModal(true)}
              style={({ pressed }) => [
                styles.selectorButton,
                { backgroundColor: theme.background, borderColor: theme.cardBorder, opacity: pressed ? 0.7 : 1 }
              ]}
            >
              <ThemedText style={{ fontWeight: '600' }}>
                {formatWeekRange(selectedWeekMonday)}
              </ThemedText>
              <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
            </Pressable>
          </ThemedView>

          {/* Shifts */}
          {shifts.map((shift, index) => (
            <ThemedView key={shift.id} type="backgroundElement" style={[styles.formCard, { borderColor: theme.cardBorder }]}>
              <View style={[styles.formRowHeader, { justifyContent: 'space-between' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                  <Ionicons name="briefcase-outline" size={20} color={theme.primary} />
                  <ThemedText style={styles.formRowTitle}>Shift {index + 1}</ThemedText>
                </View>
                <Pressable onPress={() => removeShift(shift.id)}>
                  <Ionicons name="close-circle" size={24} color={theme.error} />
                </Pressable>
              </View>

              {/* Title */}
              <View style={styles.inputGroup}>
                <ThemedText type="small" style={styles.label}>SHIFT TITLE / ROLE</ThemedText>
                <TextInput
                  style={[styles.textInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.cardBorder }]}
                  value={shift.title}
                  onChangeText={(text) => setShifts(prev => prev.map(s => s.id === shift.id ? { ...s, title: text } : s))}
                  placeholder="e.g. Waiter, Host, Bartender"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              {/* Day of Week Selector */}
              <View style={styles.inputGroup}>
                <ThemedText type="small" style={styles.label}>DAY</ThemedText>
                <Pressable
                  onPress={() => setShowDayModalFor(shift.id)}
                  style={({ pressed }) => [
                    styles.selectorButton,
                    { backgroundColor: theme.background, borderColor: theme.cardBorder, opacity: pressed ? 0.7 : 1 }
                  ]}
                >
                  <ThemedText>
                    {DAYS.find(d => d.offset === shift.dayOffset)?.label || 'Select Day'}
                  </ThemedText>
                  <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
                </Pressable>
              </View>

              {/* Times */}
              <View style={styles.timeInputsRow}>
                <View style={styles.timeCol}>
                  <ThemedText type="small" style={styles.label}>START TIME</ThemedText>
                  <Pressable
                    onPress={() => setActivePicker({ id: shift.id, type: 'start' })}
                    style={({ pressed }) => [
                      styles.selectorButton,
                      { backgroundColor: theme.background, borderColor: theme.cardBorder, opacity: pressed ? 0.7 : 1 }
                    ]}
                  >
                    <ThemedText>{formatTime(shift.startTime.toISOString())}</ThemedText>
                  </Pressable>
                </View>
                <View style={styles.timeCol}>
                  <ThemedText type="small" style={styles.label}>END TIME</ThemedText>
                  <Pressable
                    onPress={() => setActivePicker({ id: shift.id, type: 'end' })}
                    style={({ pressed }) => [
                      styles.selectorButton,
                      { backgroundColor: theme.background, borderColor: theme.cardBorder, opacity: pressed ? 0.7 : 1 }
                    ]}
                  >
                    <ThemedText>{formatTime(shift.endTime.toISOString())}</ThemedText>
                  </Pressable>
                </View>
              </View>
            </ThemedView>
          ))}

          {/* Add Another Shift Button */}
          <Pressable
            onPress={addAnotherShift}
            style={({ pressed }) => [
              styles.addShiftButton,
              { borderColor: theme.primary, opacity: pressed ? 0.7 : 1 }
            ]}
          >
            <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
            <ThemedText style={[styles.addShiftButtonText, { color: theme.primary }]}>
              Add Another Shift
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveButton,
              { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1, marginTop: Spacing.four }
            ]}
          >
            <Ionicons name="checkmark-circle-outline" size={24} color="#FFFFFF" />
            <ThemedText style={styles.saveButtonText}>Create Schedule</ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>

      {/* Week Picker Modal */}
      <Modal visible={showWeekModal} transparent animationType="slide" onRequestClose={() => setShowWeekModal(false)}>
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { borderColor: theme.cardBorder }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={{ fontSize: 18, fontWeight: 'bold' }}>Select Week</ThemedText>
              <Pressable onPress={() => setShowWeekModal(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>
            <FlatList
              data={availableWeeks}
              keyExtractor={(item) => item.toISOString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setSelectedWeekMonday(item);
                    setShowWeekModal(false);
                  }}
                  style={({ pressed }) => [
                    styles.modalListItem,
                    { backgroundColor: item.getTime() === selectedWeekMonday.getTime() ? theme.primary + '20' : 'transparent', opacity: pressed ? 0.7 : 1 }
                  ]}
                >
                  <ThemedText style={{ color: item.getTime() === selectedWeekMonday.getTime() ? theme.primary : theme.text, fontWeight: item.getTime() === selectedWeekMonday.getTime() ? 'bold' : 'normal' }}>
                    {formatWeekRange(item)}
                  </ThemedText>
                </Pressable>
              )}
            />
          </ThemedView>
        </View>
      </Modal>

      {/* Day Picker Modal */}
      <Modal visible={showDayModalFor !== null} transparent animationType="fade" onRequestClose={() => setShowDayModalFor(null)}>
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { maxHeight: 400, borderColor: theme.cardBorder }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={{ fontSize: 18, fontWeight: 'bold' }}>Select Day</ThemedText>
              <Pressable onPress={() => setShowDayModalFor(null)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>
            {DAYS.map(day => (
              <Pressable
                key={day.offset}
                onPress={() => {
                  setShifts(prev => prev.map(s => s.id === showDayModalFor ? { ...s, dayOffset: day.offset } : s));
                  setShowDayModalFor(null);
                }}
                style={({ pressed }) => [
                  styles.modalListItem,
                  { opacity: pressed ? 0.7 : 1 }
                ]}
              >
                <ThemedText style={{ fontSize: 16 }}>{day.label}</ThemedText>
              </Pressable>
            ))}
          </ThemedView>
        </View>
      </Modal>

      {/* Time Pickers */}
      {(activePicker?.type === 'start' || activePicker?.type === 'end') && (
        <DateTimePicker
          value={
            activePicker.type === 'start'
              ? shifts.find(s => s.id === activePicker.id)?.startTime || new Date()
              : shifts.find(s => s.id === activePicker.id)?.endTime || new Date()
          }
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.two, marginBottom: Spacing.four },
  appTitle: { fontSize: 28, fontWeight: 'bold', letterSpacing: -0.5 },
  appSubtitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, opacity: 0.7 },
  scrollContent: { gap: Spacing.four, paddingBottom: Spacing.six },
  formCard: { padding: Spacing.three, borderRadius: Spacing.three, borderWidth: 1, gap: Spacing.three },
  formRowHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  formRowTitle: { fontSize: 16, fontWeight: 'bold' },
  selectorButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.three, borderRadius: Spacing.two, borderWidth: 1 },
  inputGroup: { gap: Spacing.one },
  label: { fontSize: 10, fontWeight: '800', opacity: 0.6, letterSpacing: 0.5 },
  textInput: { padding: Spacing.three, borderRadius: Spacing.two, borderWidth: 1, fontSize: 16 },
  timeInputsRow: { flexDirection: 'row', gap: Spacing.three },
  timeCol: { flex: 1, gap: Spacing.one },
  addShiftButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.three, borderRadius: Spacing.three, borderWidth: 1, borderStyle: 'dashed', gap: Spacing.two },
  addShiftButtonText: { fontSize: 16, fontWeight: 'bold' },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.three, borderRadius: Spacing.three, gap: Spacing.two, elevation: 4, shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5 },
  saveButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1C1C1E', borderTopLeftRadius: Spacing.four, borderTopRightRadius: Spacing.four, borderWidth: 1, borderBottomWidth: 0, paddingBottom: Spacing.six, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.four, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#333' },
  modalListItem: { padding: Spacing.four, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#333' },
});
