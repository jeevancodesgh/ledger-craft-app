import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { palette, radius, space } from '@/theme/tokens';

interface FilterPillsProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  labels?: Partial<Record<T, string>>;
}

export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  labels,
}: FilterPillsProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroller}
    >
      {options.map((option) => {
        const active = option === value;
        const label = labels?.[option] ?? option.charAt(0).toUpperCase() + option.slice(1);
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={label}
            style={({ pressed }) => [
              styles.pill,
              active && styles.pillActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroller: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.screen,
    paddingVertical: space.sm,
    gap: space.sm,
  },
  pill: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: palette.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: palette.text,
  },
  pressed: {
    opacity: 0.72,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.text,
  },
  labelActive: {
    color: palette.surface,
  },
});
