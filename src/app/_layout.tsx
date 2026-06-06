import 'react-native-gesture-handler';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { DrawerContentScrollView, DrawerItemList } from 'expo-router/build/react-navigation/drawer';
import { useColorScheme, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ShiftProvider } from '@/context/ShiftContext';
import { ScheduleProvider } from '@/context/ScheduleContext';
import { Colors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

function CustomDrawerContent(props: any) {
  return (
    <DrawerContentScrollView {...props}>
      <View style={{ padding: 20, alignItems: 'center', marginBottom: 10 }}>
        <Image
          source={require('../../assets/images/icon.png')}
          style={{ width: 80, height: 80, borderRadius: 20, marginBottom: 10 }}
          contentFit="contain"
        />
        <ThemedText type="subtitle" style={{ fontWeight: 'bold', fontSize: 24, letterSpacing: -0.5 }}>Apron</ThemedText>
      </View>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}

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
          drawerContent={(props) => <CustomDrawerContent {...props} />}

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
