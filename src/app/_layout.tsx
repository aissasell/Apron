import 'react-native-gesture-handler';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ShiftProvider } from '@/context/ShiftContext';
import { ScheduleProvider } from '@/context/ScheduleContext';
import { Colors } from '@/constants/theme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const colors = Colors[colorScheme === 'unspecified' ? 'light' : colorScheme];

  return (
    <ScheduleProvider>
      <ShiftProvider>
        <ThemeProvider value={theme}>
        <AnimatedSplashOverlay />
        <Drawer
          screenOptions={{
            headerStyle: { backgroundColor: colors.backgroundElement, borderBottomWidth: 0 },
            headerTintColor: colors.text,
            drawerStyle: { backgroundColor: colors.background },
            drawerActiveTintColor: colors.text,
            drawerInactiveTintColor: colors.textSecondary,
          }}>
          <Drawer.Screen
            name="index"
            options={{
              title: 'Clock',
              drawerLabel: 'Home',
              drawerIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
            }}
          />
          <Drawer.Screen
            name="shift"
            options={{
              title: 'Shift',
              drawerLabel: 'Shift',
              drawerIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={color} />,
            }}
          />
          <Drawer.Screen
            name="schedule"
            options={{
              title: 'Schedule',
              drawerLabel: 'Schedule',
              drawerIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
            }}
          />
          <Drawer.Screen
            name="schedule/create"
            options={{
              drawerItemStyle: { display: 'none' },
              title: 'Create Schedule'
            }}
          />
          <Drawer.Screen
            name="schedule/[id]"
            options={{
              drawerItemStyle: { display: 'none' },
              title: 'Schedule Details'
            }}
          />
        </Drawer>
      </ThemeProvider>
    </ShiftProvider>
  </ScheduleProvider>
  );
}
