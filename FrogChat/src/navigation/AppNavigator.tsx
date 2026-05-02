import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../lib/AuthContext';
import { Chatroom } from '../lib/types';

import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import ChatroomScreen from '../screens/ChatroomScreen';
import DMListScreen from '../screens/DMListScreen';
import DMScreen from '../screens/DMScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type RootStackParamList = {
  Home: undefined;
  Chatroom: { room: Chatroom };
  DMList: undefined;
  DM: { otherUserId: string; otherUsername: string };
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { session, loading } = useAuth();

  if (loading) return null;

  if (!session) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={SplashScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Chatroom" component={ChatroomScreen} />
        <Stack.Screen name="DMList" component={DMListScreen} />
        <Stack.Screen name="DM" component={DMScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
