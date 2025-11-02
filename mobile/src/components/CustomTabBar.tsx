import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform, Animated } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const prevIndexRef = useRef(state.index);
  
  // Animation refs for each tab
  const animationRefs = useRef<{ [key: string]: Animated.Value }>({});

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

  // Initialize animation values for each route
  useEffect(() => {
    state.routes.forEach((route, index) => {
      if (!animationRefs.current[route.key]) {
        animationRefs.current[route.key] = new Animated.Value(
          state.index === index ? 1 : 0
        );
      }
    });
  }, [state.routes]);

  // Animate tabs when index changes
  useEffect(() => {
    const currentIndex = state.index;
    const prevIndex = prevIndexRef.current;

    if (currentIndex !== prevIndex) {
      // Animate previous tab out
      const prevRoute = state.routes[prevIndex];
      if (prevRoute && animationRefs.current[prevRoute.key]) {
        Animated.spring(animationRefs.current[prevRoute.key], {
          toValue: 0,
          useNativeDriver: true,
          tension: 300,
          friction: 30,
        }).start();
      }

      // Animate current tab in
      const currentRoute = state.routes[currentIndex];
      if (currentRoute && animationRefs.current[currentRoute.key]) {
        Animated.spring(animationRefs.current[currentRoute.key], {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 30,
        }).start();
      }

      prevIndexRef.current = currentIndex;
    }
  }, [state.index, state.routes]);

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
        
        // Get or create animation value
        if (!animationRefs.current[route.key]) {
          animationRefs.current[route.key] = new Animated.Value(isFocused ? 1 : 0);
        }
        const animationValue = animationRefs.current[route.key];

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

        // Animated values
        const iconScale = animationValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.15],
        });

        const iconOpacity = animationValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.6, 1],
        });

        const containerScale = animationValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.85, 1],
        });

        const labelOpacity = animationValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.6, 1],
        });

        const labelScale = animationValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.9, 1],
        });

        const backgroundColorOpacity = animationValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        });

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
            activeOpacity={0.7}
          >
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [{ scale: containerScale }],
                },
              ]}
            >
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: 24,
                    opacity: backgroundColorOpacity,
                  },
                ]}
              />
              <Animated.View
                style={{
                  transform: [{ scale: iconScale }],
                  opacity: iconOpacity,
                }}
              >
                <Feather
                  name={iconName}
                  size={24}
                  color="#ffffff"
                />
              </Animated.View>
            </Animated.View>
            <Animated.Text
              style={[
                styles.label,
                {
                  opacity: labelOpacity,
                  transform: [{ scale: labelScale }],
                },
                isFocused && styles.labelActive,
              ]}
            >
              {typeof label === 'string' ? label : route.name}
            </Animated.Text>
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

