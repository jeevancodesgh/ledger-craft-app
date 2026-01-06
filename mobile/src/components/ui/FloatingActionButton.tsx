import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface FloatingActionButtonProps {
  onAddFromCatalog: () => void;
  onAddCustomItem: () => void;
  onDuplicateLastItem?: () => void;
  hasItems?: boolean;
}

export function FloatingActionButton({
  onAddFromCatalog,
  onAddCustomItem,
  onDuplicateLastItem,
  hasItems = false,
}: FloatingActionButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowMenu(!showMenu);
    rotation.value = withSpring(showMenu ? 0 : 45);
    scale.value = withSpring(showMenu ? 1 : 1.1);
  };

  const handleOptionPress = (callback: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowMenu(false);
    rotation.value = withSpring(0);
    scale.value = withSpring(1);
    callback();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.fab}
          onPress={handlePress}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#5B72EE', '#4A5FD8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <Animated.View style={animatedStyle}>
              <Text style={styles.plusIcon}>+</Text>
            </Animated.View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        animationType="fade"
        transparent
        onRequestClose={() => {
          setShowMenu(false);
          rotation.value = withSpring(0);
          scale.value = withSpring(1);
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              setShowMenu(false);
              rotation.value = withSpring(0);
              scale.value = withSpring(1);
            }}
          />

          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => handleOptionPress(onAddFromCatalog)}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconContainer}>
                <Text style={styles.menuIcon}>📦</Text>
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuLabel}>Add from Catalog</Text>
                <Text style={styles.menuSubtext}>Choose existing item</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => handleOptionPress(onAddCustomItem)}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconContainer}>
                <Text style={styles.menuIcon}>✏️</Text>
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuLabel}>Add Custom Item</Text>
                <Text style={styles.menuSubtext}>Create new line item</Text>
              </View>
            </TouchableOpacity>

            {hasItems && onDuplicateLastItem && (
              <TouchableOpacity
                style={styles.menuOption}
                onPress={() => handleOptionPress(onDuplicateLastItem)}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconContainer}>
                  <Text style={styles.menuIcon}>📋</Text>
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuLabel}>Duplicate Last Item</Text>
                  <Text style={styles.menuSubtext}>Copy previous item</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 90,
    right: 20,
    zIndex: 999,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#5B72EE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  gradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIcon: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: '300',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? 180 : 170,
    paddingRight: 20,
    alignItems: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  menuContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    minWidth: 240,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuIcon: {
    fontSize: 20,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  menuSubtext: {
    fontSize: 12,
    color: '#64748b',
  },
});


