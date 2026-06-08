import React, { useState } from 'react';
import { StyleSheet, View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MoneyCalculator } from '@/components/money-calculator';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function CalculatorScreen() {
  const theme = useTheme();
  const [total, setTotal] = useState(0);
  const [resetKey, setResetKey] = useState(0);

  const handleClear = () => {
    setResetKey(prev => prev + 1);
    setTotal(0);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* Header Summary */}
          <ThemedView type="backgroundElement" style={[styles.summaryCard, { borderColor: theme.cardBorder }]}>
            <ThemedText type="small" style={styles.summaryLabel}>TOTAL AMOUNT</ThemedText>
            <ThemedText style={styles.summaryValue}>
              ${total.toFixed(2)}
            </ThemedText>
            
            <Pressable 
              style={({ pressed }) => [
                styles.clearBtn,
                { opacity: pressed ? 0.7 : 1 }
              ]}
              onPress={handleClear}
            >
              <Ionicons name="refresh-outline" size={16} color={theme.text} />
              <ThemedText style={styles.clearBtnText}>Clear All</ThemedText>
            </Pressable>
          </ThemedView>

          {/* Calculator Component */}
          <View style={styles.calculatorSection}>
            <MoneyCalculator 
              onTotalChange={setTotal} 
              resetSignal={resetKey} 
            />
          </View>
          
        </ScrollView>
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
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.four,
    paddingBottom: 100, // extra padding for keyboard/bottom tab
  },
  summaryCard: {
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: Spacing.three,
    borderWidth: 1,
    gap: Spacing.two,
  },
  summaryLabel: {
    fontWeight: '800',
    letterSpacing: 1,
    opacity: 0.6,
  },
  summaryValue: {
    fontSize: 48,
    fontWeight: 'bold',
    lineHeight: 38,
    fontVariant: ['tabular-nums'],
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.two,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: Spacing.two,
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  calculatorSection: {
    marginTop: Spacing.two,
  }
});
