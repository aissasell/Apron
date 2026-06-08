import React, { useState } from 'react';
import 'react-native-gesture-handler';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { DrawerContentScrollView, DrawerItemList } from 'expo-router/build/react-navigation/drawer';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ShiftProvider } from '@/context/ShiftContext';
import { ScheduleProvider } from '@/context/ScheduleContext';
import { Colors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { AppThemeProvider, useAppTheme } from '@/context/ThemeContext';

function CustomDrawerContent(props: any) {
  const { themePreference, setThemePreference, activeTheme } = useAppTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const colors = Colors[activeTheme];

  const options: { label: string; value: 'light' | 'dark' | 'system'; icon: any }[] = [
    { label: 'System Automatic', value: 'system', icon: 'settings-outline' },
    { label: 'Light Mode', value: 'light', icon: 'sunny-outline' },
    { label: 'Dark Mode', value: 'dark', icon: 'moon-outline' }
  ];

  const currentOption = options.find(o => o.value === themePreference) || options[0];

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ padding: 20, alignItems: 'center', marginBottom: 10 }}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={{ width: 80, height: 80, borderRadius: 20, marginBottom: 10 }}
            contentFit="contain"
          />
          <ThemedText type="subtitle" style={{ fontWeight: 'bold', fontSize: 24, letterSpacing: -0.5 }}>Apron</ThemedText>
        </View>
        <DrawerItemList {...props} />
        <View style={{ flex: 1 }} />
      </DrawerContentScrollView>
      
      <View style={{ padding: 20, paddingBottom: 40, borderTopWidth: 1, borderTopColor: colors.cardBorder }}>
        <ThemedText style={{ fontSize: 12, opacity: 0.5, marginBottom: 10, fontWeight: 'bold', letterSpacing: 1 }}>THEME</ThemedText>
        
        {showDropdown && (
          <View style={{ 
            position: 'absolute', bottom: 105, left: 20, right: 20, 
            backgroundColor: colors.backgroundElement, 
            borderRadius: 12, 
            borderWidth: 1, borderColor: colors.cardBorder,
            padding: 5,
            zIndex: 100,
            shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5
          }}>
            {options.map((opt) => (
              <Pressable 
                key={opt.value}
                style={{ 
                  flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8,
                  backgroundColor: themePreference === opt.value ? colors.cardBorder : 'transparent'
                }}
                onPress={() => {
                  setThemePreference(opt.value);
                  setShowDropdown(false);
                }}
              >
                <Ionicons name={opt.icon} size={18} color={colors.text} style={{ marginRight: 10 }} />
                <ThemedText>{opt.label}</ThemedText>
              </Pressable>
            ))}
          </View>
        )}

        <Pressable 
          style={{ 
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.cardBorder,
            backgroundColor: colors.backgroundElement
          }}
          onPress={() => setShowDropdown(!showDropdown)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name={currentOption.icon} size={18} color={colors.text} style={{ marginRight: 10 }} />
            <ThemedText style={{ fontWeight: 'bold' }}>{currentOption.label}</ThemedText>
          </View>
          <Ionicons name={showDropdown ? "chevron-down" : "chevron-up"} size={18} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

function DrawerLayout() {
  const { activeTheme } = useAppTheme();
  const theme = activeTheme === 'dark' ? DarkTheme : DefaultTheme;
  const colors = Colors[activeTheme];

  return (
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
          name="calculator"
          options={{
            title: 'Calculator',
            drawerLabel: 'Money Calculator',
            drawerIcon: ({ color, size }) => <Ionicons name="calculator-outline" size={size} color={color} />,
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
  );
}

export default function TabLayout() {
  return (
    <AppThemeProvider>
      <ScheduleProvider>
        <ShiftProvider>
          <DrawerLayout />
        </ShiftProvider>
      </ScheduleProvider>
    </AppThemeProvider>
  );
}
