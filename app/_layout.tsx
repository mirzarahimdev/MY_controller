import { Stack } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProjectsProvider } from '../context/ProjectsContext';
import { colors } from '../constants/theme';
import { setupNotifications } from '../utils/notifications';

export default function RootLayout() {
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.surface).catch(() => undefined);
    setupNotifications().catch(() => undefined);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ProjectsProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.bg },
              headerTintColor: colors.ink,
              headerTitleStyle: { fontWeight: '700' },
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="project/[id]"
              options={{
                title: 'Tafsilot',
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="add"
              options={{
                title: 'Loyiha',
                presentation: 'modal',
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="import-github"
              options={{
                title: 'GitHub import',
                presentation: 'modal',
                headerShadowVisible: false,
              }}
            />
          </Stack>
        </ProjectsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
