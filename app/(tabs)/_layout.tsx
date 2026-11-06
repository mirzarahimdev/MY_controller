import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/theme';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 6);

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.bg,
        },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '800', color: colors.ink, fontSize: 18 },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.soft,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontWeight: '700',
          fontSize: 11,
          lineHeight: 14,
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          // height berilmaydi — matn kesilmasin
          minHeight: 58 + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Asosiy',
          headerShown: false,
          tabBarLabel: 'Asosiy',
          tabBarIcon: ({ color }) => (
            <Ionicons name="grid-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Loyihalar',
          tabBarLabel: 'Loyihalar',
          tabBarIcon: ({ color }) => (
            <Ionicons name="layers-outline" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
