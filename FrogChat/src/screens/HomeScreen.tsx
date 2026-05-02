import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { Chatroom } from '../lib/types';
import FrogAvatar from '../components/FrogAvatar';
import { useAuth } from '../lib/AuthContext';
import { COLORS } from '../lib/theme';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const [rooms, setRooms] = useState<Chatroom[]>([]);
  const { profile } = useAuth();
  const navigation = useNavigation<Nav>();

  useEffect(() => {
    supabase.from('chatrooms').select('*').order('name').then(({ data }) => {
      if (data) setRooms(data);
    });
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.logo}>🐸 FrogChat</Text>
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => navigation.navigate('Profile')}
        >
          {profile && <FrogAvatar userId={profile.id} size={36} />}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chatrooms</Text>
        <Text style={styles.sectionSub}>Jump into a topic</Text>
      </View>

      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.roomCard}
            onPress={() => navigation.navigate('Chatroom', { room: item })}
            activeOpacity={0.7}
          >
            <Text style={styles.roomEmoji}>{item.emoji}</Text>
            <View style={styles.roomInfo}>
              <Text style={styles.roomName}>{item.name}</Text>
              <Text style={styles.roomDesc}>{item.description}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={styles.dmButton}
        onPress={() => navigation.navigate('DMList')}
      >
        <Text style={styles.dmButtonText}>💬 Direct Messages</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: COLORS.card,
    borderBottomColor: COLORS.cardBorder,
    borderBottomWidth: 1,
  },
  logo: { fontSize: 22, fontWeight: '800', color: COLORS.accent },
  profileBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  section: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  sectionSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  list: { paddingHorizontal: 16, paddingBottom: 8 },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  roomEmoji: { fontSize: 30, marginRight: 14 },
  roomInfo: { flex: 1 },
  roomName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    textTransform: 'capitalize',
  },
  roomDesc: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  arrow: { fontSize: 24, color: COLORS.textMuted },
  dmButton: {
    margin: 16,
    backgroundColor: COLORS.dm,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  dmButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
