import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();

  const getIconName = (routeName: string): keyof typeof Feather.glyphMap => {
    switch (routeName) {
      case 'Dashboard':
        return 'home';
      case 'Invoices':
        return 'file-text';
      case 'Settings':
        return 'settings';
      default:
        return 'circle';
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;
        const iconName = getIconName(route.name);

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabButton}
          >
            <View
              style={[
                styles.iconContainer,
                isFocused && styles.iconContainerActive,
              ]}
            >
              <Feather
                name={iconName}
                size={24}
                color={isFocused ? '#ffffff' : 'rgba(255, 255, 255, 0.6)'}
              />
            </View>
            <Text
              style={[
                styles.label,
                isFocused && styles.labelActive,
              ]}
            >
              {typeof label === 'string' ? label : route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1a1f3a',
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconContainerActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  label: {
    fontSize: 11,
    marginTop: 4,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  labelActive: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
});

export default CustomTabBar;

