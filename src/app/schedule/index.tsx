import React from 'react';
import { StyleSheet, View, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSchedules } from '@/context/ScheduleContext';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, MaxContentWidth, BottomTabInset } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { formatDateShort } from '@/utils/dateHelpers';

export default function ScheduleIndexScreen() {
  const { schedules } = useSchedules();
  const theme = useTheme();
  const router = useRouter();

  const handleAddPress = () => {
    router.push('/schedule/create');
  };

  const renderScheduleItem = ({ item }: { item: any }) => {
    const endD = new Date(item.startDate);
    endD.setDate(endD.getDate() + 6);

    return (
      <Pressable 
        onPress={() => router.push(`/schedule/${item.id}`)}
        style={({ pressed }) => [
          styles.scheduleCard,
          { borderColor: theme.cardBorder, backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 }
        ]}
      >
        <View style={styles.scheduleInfo}>
          <ThemedText style={styles.scheduleDates}>
            {formatDateShort(new Date(item.startDate).toISOString())} - {formatDateShort(endD.toISOString())}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {item.shifts.length} shift(s) scheduled
          </ThemedText>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
      </Pressable>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <ThemedText type="small" style={styles.appSubtitle}>MANAGEMENT</ThemedText>
            <ThemedText type="subtitle" style={styles.appTitle}>Schedules</ThemedText>
          </View>
          {schedules.length > 0 && (
            <Pressable onPress={handleAddPress}>
              <Ionicons name="add-circle" size={32} color={theme.primary} />
            </Pressable>
          )}
        </View>

        {schedules.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Pressable 
              onPress={handleAddPress}
              style={({ pressed }) => [
                styles.emptyAddButton,
                { borderColor: theme.cardBorder, opacity: pressed ? 0.6 : 1 }
              ]}
            >
              <Ionicons name="add" size={64} color={theme.primary} />
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={schedules}
            keyExtractor={item => item.id}
            renderItem={renderScheduleItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyAddButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.three,
  },
  emptyText: {
    fontWeight: 'bold',
    opacity: 0.8,
  },
  listContent: {
    gap: Spacing.three,
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  scheduleInfo: {
    flex: 1,
    gap: Spacing.one,
  },
  scheduleDates: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
