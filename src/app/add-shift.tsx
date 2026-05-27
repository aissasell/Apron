import React, { useState } from 'react';
import { StyleSheet, Pressable, View, Platform, Alert, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useShifts } from '@/context/ShiftContext';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { formatDateShort, formatTime, formatDuration } from '@/utils/dateHelpers';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function AddShiftScreen() {
  const { addManualShifts } = useShifts();
  const theme = useTheme();
  const router = useRouter();

  // Core Form States
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  function createDefaultSegment() {
    const tStart = new Date();
    tStart.setHours(9, 0, 0, 0);
    const tEnd = new Date();
    tEnd.setHours(17, 0, 0, 0);
    return {
      id: Math.random().toString(36).substring(2, 9),
      startTime: tStart,
      endTime: tEnd,
      tips: '',
    };
  }

  // We manage an array of shifts
  const [segments, setSegments] = useState<{ id: string; startTime: Date; endTime: Date; tips?: string }[]>([
    createDefaultSegment()
  ]);

  // Which picker is currently showing
  const [activePicker, setActivePicker] = useState<{ id: string; type: 'start' | 'end' } | null>(null);

  // Derive everything during render
  const computedSegments = segments.map((seg) => {
    const start = new Date(date);
    start.setHours(seg.startTime.getHours(), seg.startTime.getMinutes(), 0, 0);

    const end = new Date(date);
    end.setHours(seg.endTime.getHours(), seg.endTime.getMinutes(), 0, 0);

    let isNextDay = false;
    if (end.getTime() <= start.getTime()) {
      end.setDate(end.getDate() + 1);
      isNextDay = true;
    }

    const diffMs = end.getTime() - start.getTime();
    const dur = diffMs / (1000 * 60 * 60);

    return {
      ...seg,
      startDateTime: start,
      endDateTime: end,
      durationHours: dur,
      crossesMidnight: isNextDay,
    };
  });

  const totalDurationHours = computedSegments.reduce((sum, seg) => sum + seg.durationHours, 0);

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const onTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setActivePicker(null);
    }
    if (selectedTime && activePicker) {
      setSegments(prev => prev.map(seg => {
        if (seg.id === activePicker.id) {
          if (activePicker.type === 'start') {
            return { ...seg, startTime: selectedTime };
          } else {
            return { ...seg, endTime: selectedTime };
          }
        }
        return seg;
      }));
    }
  };

  const addAnotherShift = () => {
    const newSeg = createDefaultSegment();
    if (segments.length > 0) {
      const lastSeg = segments[segments.length - 1];
      const newStart = new Date(lastSeg.endTime);
      newStart.setHours(newStart.getHours() + 1);
      const newEnd = new Date(newStart);
      newEnd.setHours(newEnd.getHours() + 4);
      newSeg.startTime = newStart;
      newSeg.endTime = newEnd;
    }
    setSegments([...segments, newSeg]);
  };

  const removeShift = (id: string) => {
    if (segments.length > 1) {
      setSegments(segments.filter(s => s.id !== id));
    }
  };

  const handleSave = async () => {
    if (totalDurationHours <= 0) {
      Alert.alert('Invalid Shift', 'The total duration must be greater than 0.');
      return;
    }

    if (totalDurationHours > 24) {
      Alert.alert('Invalid Shift', 'Total tracked hours for a single day cannot exceed 24 hours.');
      return;
    }

    // Format shifts for context
    const shiftsData = computedSegments.map(seg => ({
      startTime: seg.startDateTime.toISOString(),
      endTime: seg.endDateTime.toISOString(),
      tips: parseFloat(seg.tips || '0') || 0
    }));

    const success = await addManualShifts(shiftsData);

    if (success) {
      Alert.alert(
        'Shift Logged',
        'Your manual shift has been successfully saved.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset
              setDate(new Date());
              setSegments([createDefaultSegment()]);
              router.push('/history');
            }
          }
        ]
      );
    } else {
      Alert.alert('Error', 'Failed to save shift. Please try again.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText type="small" style={styles.appSubtitle}>MANUAL ENTRY</ThemedText>
            <ThemedText type="subtitle" style={styles.appTitle}>Log Shift</ThemedText>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Card Date Selector */}
          <ThemedView type="backgroundElement" style={[styles.formCard, { borderColor: theme.cardBorder }]}>
            <View style={styles.formRowHeader}>
              <Ionicons name="calendar-outline" size={20} color={theme.primary} />
              <ThemedText style={styles.formRowTitle}>Shift Date</ThemedText>
            </View>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              style={({ pressed }) => [
                styles.selectorButton,
                { backgroundColor: theme.background, borderColor: theme.cardBorder, opacity: pressed ? 0.7 : 1 }
              ]}
            >
              <ThemedText>{formatDateShort(date.toISOString())}</ThemedText>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </Pressable>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={onDateChange}
                maximumDate={new Date()}
              />
            )}
          </ThemedView>

          {/* Times Selection Cards */}
          {computedSegments.map((seg, index) => (
            <ThemedView key={seg.id} type="backgroundElement" style={[styles.formCard, { borderColor: theme.cardBorder }]}>
              <View style={[styles.formRowHeader, { justifyContent: 'space-between' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                  <Ionicons name="time-outline" size={20} color={theme.primary} />
                  <ThemedText style={styles.formRowTitle}>Shift {index + 1}</ThemedText>
                </View>
                {computedSegments.length > 1 && (
                  <Pressable onPress={() => removeShift(seg.id)}>
                    <Ionicons name="close-circle" size={24} color={theme.error} />
                  </Pressable>
                )}
              </View>

              <View style={styles.timeInputsRow}>
                {/* Start Time Column */}
                <View style={styles.timeCol}>
                  <ThemedText type="small" style={styles.timeColLabel}>START TIME</ThemedText>
                  <Pressable
                    onPress={() => setActivePicker({ id: seg.id, type: 'start' })}
                    style={({ pressed }) => [
                      styles.selectorButton,
                      { backgroundColor: theme.background, borderColor: theme.cardBorder, opacity: pressed ? 0.7 : 1 }
                    ]}
                  >
                    <ThemedText>{formatTime(seg.startDateTime.toISOString())}</ThemedText>
                  </Pressable>
                </View>

                {/* End Time Column */}
                <View style={styles.timeCol}>
                  <ThemedText type="small" style={styles.timeColLabel}>END TIME</ThemedText>
                  <Pressable
                    onPress={() => setActivePicker({ id: seg.id, type: 'end' })}
                    style={({ pressed }) => [
                      styles.selectorButton,
                      { backgroundColor: theme.background, borderColor: theme.cardBorder, opacity: pressed ? 0.7 : 1 }
                    ]}
                  >
                    <ThemedText>{formatTime(seg.endDateTime.toISOString())}</ThemedText>
                  </Pressable>
                </View>
              </View>

              {/* Tips Input Row */}
              <View style={styles.tipsInputRow}>
                <ThemedText type="small" style={styles.timeColLabel}>TIPS EARNED (OPTIONAL)</ThemedText>
                <View style={styles.tipInputContainer}>
                  <ThemedText style={styles.currencySymbol}>$</ThemedText>
                  <TextInput
                    style={[styles.tipInput, { color: theme.text }]}
                    value={seg.tips}
                    onChangeText={(text) => {
                      setSegments(prev => prev.map(s => s.id === seg.id ? { ...s, tips: text } : s));
                    }}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
              </View>

              {/* Overnights Notice for this segment */}
              {seg.crossesMidnight && (
                <View style={styles.noticeBox}>
                  <Ionicons name="information-circle-outline" size={16} color={theme.primary} />
                  <ThemedText type="small" style={{ color: theme.primary, flex: 1 }}>
                    Starts {formatDateShort(seg.startDateTime.toISOString())} & ends the next morning.
                  </ThemedText>
                </View>
              )}
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

          {activePicker && (
            <DateTimePicker
              value={
                activePicker.type === 'start' 
                  ? segments.find(s => s.id === activePicker.id)?.startTime || new Date()
                  : segments.find(s => s.id === activePicker.id)?.endTime || new Date()
              }
              mode="time"
              is24Hour={false}
              display="default"
              onChange={onTimeChange}
            />
          )}

          {/* Live Preview Card */}
          <ThemedView type="backgroundElement" style={[styles.previewCard, { borderColor: theme.cardBorder }]}>
            <ThemedText type="small" style={styles.previewLabel}>TOTAL CALCULATED DURATION</ThemedText>
            <ThemedText style={[styles.previewValue, { color: theme.primary }]}>
              {formatDuration(totalDurationHours)}
            </ThemedText>
            <ThemedText type="small" style={styles.previewSub}>
              {totalDurationHours.toFixed(2)} hours total
            </ThemedText>
          </ThemedView>

          {/* Submit Button */}
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveButton,
              { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1 }
            ]}
          >
            <Ionicons name="checkmark-circle-outline" size={24} color="#FFFFFF" />
            <ThemedText style={styles.saveButtonText}>Save Shift</ThemedText>
          </Pressable>

        </ScrollView>
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
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
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
  scrollContent: {
    gap: Spacing.four,
    paddingBottom: Spacing.six,
  },
  formCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    gap: Spacing.three,
  },
  formRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  formRowTitle: {
    fontSize: 16,
    fontWeight: 'bold',
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
  timeColLabel: {
    fontSize: 10,
    fontWeight: '800',
    opacity: 0.6,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 140, 0, 0.08)',
    padding: Spacing.two,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  addShiftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: Spacing.two,
    marginTop: -Spacing.two,
  },
  addShiftButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  previewCard: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: '800',
    opacity: 0.6,
    letterSpacing: 1,
  },
  previewValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  previewSub: {
    opacity: 0.5,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
    marginTop: Spacing.two,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tipsInputRow: {
    marginTop: Spacing.two,
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
});
