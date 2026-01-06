import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface ProgressIndicatorProps {
  steps: {
    label: string;
    completed: boolean;
  }[];
}

export function ProgressIndicator({ steps }: ProgressIndicatorProps) {
  const completedCount = steps.filter((s) => s.completed).length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.stepsContainer}>
        {steps.map((step, index) => (
          <View key={step.label} style={styles.step}>
            <View
              style={[
                styles.stepIcon,
                step.completed && styles.stepIconCompleted,
              ]}
            >
              {step.completed ? (
                <Text style={styles.checkmark}>✓</Text>
              ) : (
                <View style={styles.circle} />
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                step.completed && styles.stepLabelCompleted,
              ]}
            >
              {step.label}
            </Text>
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.connector,
                  step.completed && styles.connectorCompleted,
                ]}
              />
            )}
          </View>
        ))}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground} />
        <Animated.View
          entering={FadeIn.duration(400)}
          style={[styles.progressBarFill, { width: `${progress}%` }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  step: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepIconCompleted: {
    backgroundColor: '#5B72EE',
    borderColor: '#5B72EE',
  },
  checkmark: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
  },
  circle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#cbd5e1',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    textAlign: 'center',
  },
  stepLabelCompleted: {
    color: '#5B72EE',
  },
  connector: {
    position: 'absolute',
    top: 13,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: '#e2e8f0',
    zIndex: -1,
  },
  connectorCompleted: {
    backgroundColor: '#5B72EE',
  },
  progressBarContainer: {
    height: 4,
    position: 'relative',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#e2e8f0',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#5B72EE',
    borderRadius: 2,
  },
});


