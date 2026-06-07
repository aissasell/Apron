import React, { useState } from 'react';
import { StyleSheet, View, Pressable, ScrollView, Alert, Modal, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useSchedules, ScheduledShift } from '@/context/ScheduleContext';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { formatDateShort, formatTime, hasOverlappingShifts } from '@/utils/dateHelpers';

export default function ScheduleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { schedules, deleteSchedule, addShiftToSchedule, updateShiftInSchedule, deleteShiftFromSchedule } = useSchedules();
  const theme = useTheme();
  const router = useRouter();

  const schedule = schedules.find(s => s.id === id);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  
  // Modal Form State
  const [shiftDate, setShiftDate] = useState(new Date());
  const [shiftTitle, setShiftTitle] = useState('Waiter');
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  if (!schedule) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Schedule not found.</ThemedText>
        <Pressable onPress={() => router.back()}><ThemedText>Go Back</ThemedText></Pressable>
      </ThemedView>
    );
  }

  const startDateObj = new Date(schedule.startDate);
  const endDateObj = new Date(startDateObj);
  endDateObj.setDate(endDateObj.getDate() + 6);

  const openAddModal = (dateStr?: string) => {
    setEditingShiftId(null);
    setShiftTitle('Waiter');
    
    let d = new Date(startDateObj);
    if (dateStr) {
      d = new Date(dateStr);
    }
    setShiftDate(d);
    
    const sTime = new Date(d);
    sTime.setHours(9, 0, 0, 0);
    setStartTime(sTime);
    
    const eTime = new Date(d);
    eTime.setHours(17, 0, 0, 0);
    setEndTime(eTime);

    setModalVisible(true);
  };

  const openEditModal = (shift: ScheduledShift) => {
    setEditingShiftId(shift.id);
    setShiftTitle(shift.title);
    setShiftDate(new Date(shift.date));
    setStartTime(new Date(shift.startTime));
    setEndTime(new Date(shift.endTime));
    setModalVisible(true);
  };

  const saveShift = async () => {
    if (!shiftTitle.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    const start = new Date(shiftDate);
    start.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
    const end = new Date(shiftDate);
    end.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
    if (end.getTime() <= start.getTime()) {
      end.setDate(end.getDate() + 1);
    }

    const shiftData = {
      title: shiftTitle,
      date: shiftDate.toISOString(),
      startTime: start.toISOString(),
      endTime: end.toISOString()
    };

    const otherShifts = schedule.shifts.filter(s => s.id !== editingShiftId);
    if (hasOverlappingShifts([...otherShifts, shiftData])) {
      Alert.alert('Error', 'This shift overlaps with another existing shift.');
      return;
    }

    if (editingShiftId) {
      await updateShiftInSchedule(schedule.id, editingShiftId, shiftData);
    } else {
      await addShiftToSchedule(schedule.id, shiftData);
    }
    setModalVisible(false);
  };

  const confirmDeleteShift = (shiftId: string) => {
    Alert.alert('Delete Shift', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteShiftFromSchedule(schedule.id, shiftId) }
    ]);
  };

  const confirmDeleteSchedule = () => {
    Alert.alert('Delete Schedule', 'Are you sure you want to delete this entire 7-day schedule?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteSchedule(schedule.id);
          router.replace('/schedule');
        }
      }
    ]);
  };

  // Group shifts by day (0 to 6)
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startDateObj);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayShifts = schedule.shifts.filter(s => s.date.startsWith(dateStr));
    return { date: d, dateStr, shifts: dayShifts };
  });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={{ paddingRight: Spacing.three }}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <ThemedText type="small" style={styles.appSubtitle}>SCHEDULE DETAILS</ThemedText>
            <ThemedText type="subtitle" style={styles.appTitle}>
              {formatDateShort(startDateObj.toISOString())} - {formatDateShort(endDateObj.toISOString())}
            </ThemedText>
          </View>
          <Pressable onPress={confirmDeleteSchedule}>
            <Ionicons name="trash-outline" size={24} color={theme.error} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {days.map((day, idx) => (
            <ThemedView key={idx} type="backgroundElement" style={[styles.dayCard, { borderColor: theme.cardBorder }]}>
              <View style={styles.dayHeader}>
                <ThemedText style={styles.dayTitle}>{formatDateShort(day.date.toISOString())}</ThemedText>
                <Pressable onPress={() => openAddModal(day.date.toISOString())}>
                  <Ionicons name="add-circle" size={24} color={theme.primary} />
                </Pressable>
              </View>

              {day.shifts.length === 0 ? (
                <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.two }}>No shifts</ThemedText>
              ) : (
                day.shifts.map(shift => (
                  <View key={shift.id} style={[styles.shiftItem, { borderColor: theme.cardBorder }]}>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ fontWeight: 'bold' }}>{shift.title}</ThemedText>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>
                        {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                      </ThemedText>
                    </View>
                    <View style={{ flexDirection: 'row', gap: Spacing.two }}>
                      <Pressable onPress={() => openEditModal(shift)}>
                        <Ionicons name="pencil" size={20} color={theme.text} />
                      </Pressable>
                      <Pressable onPress={() => confirmDeleteShift(shift.id)}>
                        <Ionicons name="trash" size={20} color={theme.error} />
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </ThemedView>
          ))}
        </ScrollView>
      </SafeAreaView>

      {/* Edit/Add Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { borderColor: theme.cardBorder, backgroundColor: theme.background }]}>
            <ThemedText style={styles.modalTitle}>{editingShiftId ? 'Edit Shift' : 'Add Shift'}</ThemedText>
            
            <View style={{ width: '100%', gap: Spacing.three, marginBottom: Spacing.four }}>
              <View>
                <ThemedText type="small" style={styles.label}>TITLE</ThemedText>
                <TextInput
                  style={[styles.textInput, { color: theme.text, borderColor: theme.cardBorder, backgroundColor: theme.backgroundElement }]}
                  value={shiftTitle}
                  onChangeText={setShiftTitle}
                />
              </View>

              <View>
                <ThemedText type="small" style={styles.label}>DATE</ThemedText>
                <Pressable onPress={() => setShowDatePicker(true)} style={[styles.selectorButton, { borderColor: theme.cardBorder, backgroundColor: theme.backgroundElement }]}>
                  <ThemedText>{formatDateShort(shiftDate.toISOString())}</ThemedText>
                </Pressable>
                {showDatePicker && (
                  <DateTimePicker
                    value={shiftDate}
                    mode="date"
                    display="default"
                    minimumDate={startDateObj}
                    maximumDate={endDateObj}
                    onChange={(e, d) => {
                      if (Platform.OS === 'android') setShowDatePicker(false);
                      if (d) setShiftDate(d);
                    }}
                  />
                )}
              </View>

              <View style={{ flexDirection: 'row', gap: Spacing.three }}>
                <View style={{ flex: 1 }}>
                  <ThemedText type="small" style={styles.label}>START TIME</ThemedText>
                  <Pressable onPress={() => setShowStartPicker(true)} style={[styles.selectorButton, { borderColor: theme.cardBorder, backgroundColor: theme.backgroundElement }]}>
                    <ThemedText>{formatTime(startTime.toISOString())}</ThemedText>
                  </Pressable>
                  {showStartPicker && (
                    <DateTimePicker
                      value={startTime}
                      mode="time"
                      display="default"
                      onChange={(e, d) => {
                        if (Platform.OS === 'android') setShowStartPicker(false);
                        if (d) setStartTime(d);
                      }}
                    />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText type="small" style={styles.label}>END TIME</ThemedText>
                  <Pressable onPress={() => setShowEndPicker(true)} style={[styles.selectorButton, { borderColor: theme.cardBorder, backgroundColor: theme.backgroundElement }]}>
                    <ThemedText>{formatTime(endTime.toISOString())}</ThemedText>
                  </Pressable>
                  {showEndPicker && (
                    <DateTimePicker
                      value={endTime}
                      mode="time"
                      display="default"
                      onChange={(e, d) => {
                        if (Platform.OS === 'android') setShowEndPicker(false);
                        if (d) setEndTime(d);
                      }}
                    />
                  )}
                </View>
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, { backgroundColor: theme.cardBorder }]} onPress={() => setModalVisible(false)}>
                <ThemedText>Cancel</ThemedText>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: theme.primary }]} onPress={saveShift}>
                <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>Save</ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        </View>
      </Modal>
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
  appTitle: { fontSize: 24, fontWeight: 'bold', letterSpacing: -0.5 },
  appSubtitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, opacity: 0.7 },
  scrollContent: { gap: Spacing.four, paddingBottom: Spacing.six },
  dayCard: { padding: Spacing.three, borderRadius: Spacing.three, borderWidth: 1 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayTitle: { fontSize: 16, fontWeight: 'bold' },
  shiftItem: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.two, padding: Spacing.two, borderRadius: Spacing.two, borderWidth: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Spacing.four },
  modalContent: { width: '100%', maxWidth: 400, padding: Spacing.four, borderRadius: Spacing.three, borderWidth: 1, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: Spacing.four },
  label: { fontSize: 10, fontWeight: '800', opacity: 0.6, marginBottom: Spacing.one },
  textInput: { padding: Spacing.three, borderRadius: Spacing.two, borderWidth: 1, fontSize: 16 },
  selectorButton: { padding: Spacing.three, borderRadius: Spacing.two, borderWidth: 1 },
  modalActions: { flexDirection: 'row', gap: Spacing.three, width: '100%' },
  modalBtn: { flex: 1, paddingVertical: Spacing.three, borderRadius: Spacing.two, alignItems: 'center', justifyContent: 'center' },
});
