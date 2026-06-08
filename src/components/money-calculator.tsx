import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, Platform } from 'react-native';
import { ThemedText } from './themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export interface MoneyCalculatorProps {
  onTotalChange?: (total: number) => void;
  resetSignal?: number;
}

const DENOMINATIONS = [
  { label: '$100', value: 100, type: 'bill' },
  { label: '$50', value: 50, type: 'bill' },
  { label: '$20', value: 20, type: 'bill' },
  { label: '$10', value: 10, type: 'bill' },
  { label: '$5', value: 5, type: 'bill' },
  { label: '$1', value: 1, type: 'bill' },
  { label: '25¢', value: 0.25, type: 'coin' },
  { label: '10¢', value: 0.10, type: 'coin' },
  { label: '5¢', value: 0.05, type: 'coin' },
  { label: '1¢', value: 0.01, type: 'coin' },
];

export function MoneyCalculator({ onTotalChange, resetSignal }: MoneyCalculatorProps) {
  const theme = useTheme();
  
  const [counts, setCounts] = useState<Record<number, string>>({});

  useEffect(() => {
    if (resetSignal !== undefined) {
      setCounts({});
    }
  }, [resetSignal]);

  useEffect(() => {
    let total = 0;
    Object.keys(counts).forEach((key) => {
      const val = parseFloat(key);
      const count = parseInt(counts[val] || '0', 10);
      if (!isNaN(count)) {
        total += val * count;
      }
    });
    if (onTotalChange) {
      onTotalChange(total);
    }
  }, [counts, onTotalChange]);

  const handleChange = (val: number, text: string) => {
    setCounts(prev => ({
      ...prev,
      [val]: text.replace(/[^0-9]/g, '') // only allow numbers
    }));
  };

  const renderDenomination = (item: typeof DENOMINATIONS[0]) => {
    return (
      <View key={item.label} style={styles.row}>
        <ThemedText style={styles.label}>{item.label}</ThemedText>
        <TextInput
          style={[styles.input, { color: theme.text, backgroundColor: 'rgba(128, 128, 128, 0.1)' }]}
          keyboardType="number-pad"
          value={counts[item.value] || ''}
          onChangeText={(text) => handleChange(item.value, text)}
          placeholder="0"
          placeholderTextColor={theme.textSecondary}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.column}>
        <ThemedText style={styles.sectionTitle}>Bills</ThemedText>
        {DENOMINATIONS.filter(d => d.type === 'bill').map(renderDenomination)}
      </View>
      <View style={styles.column}>
        <ThemedText style={styles.sectionTitle}>Coins</ThemedText>
        {DENOMINATIONS.filter(d => d.type === 'coin').map(renderDenomination)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.four,
    width: '100%',
  },
  column: {
    flex: 1,
    gap: Spacing.two,
  },
  sectionTitle: {
    fontWeight: 'bold',
    opacity: 0.7,
    marginBottom: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  label: {
    fontWeight: '600',
    flex: 1,
  },
  input: {
    flex: 2,
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Platform.OS === 'ios' ? Spacing.two : Spacing.one,
    fontSize: 16,
    textAlign: 'right',
  }
});
