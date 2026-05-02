import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import FrogAvatar from '../components/FrogAvatar';
import { useAuth } from '../lib/AuthContext';
import { COLORS } from '../lib/theme';

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();
  const navigation = useNavigation();

  function handleSignOut() {
    Alert.alert(
      'Leave the pond?',
      'Your username and avatar will be gone forever.',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: signOut },
      ]
    );
  }

  if (!profile) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Frog</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.avatarWrap}>
          <FrogAvatar userId={profile.id} size={120} />
        </View>
        <Text style={styles.username}>{profile.username}</Text>
        <Text style={styles.sub}>Your anonymous identity 🐸</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>User ID</Text>
          <Text style={styles.infoValue} numberOfLines={1}>{profile.id.slice(0, 16)}…</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Member since</Text>
          <Text style={styles.infoValue}>
            {new Date(profile.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>🔒 You're anonymous</Text>
        <Text style={styles.noteText}>
          No email, no phone number, no real name. Your frog avatar and username
          are randomly generated and tied only to this device.
        </Text>
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Leave the pond</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomColor: COLORS.cardBorder,
    borderBottomWidth: 1,
    gap: 10,
  },
  backBtn: {},
  backText: { fontSize: 28, color: COLORS.text },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  card: {
    margin: 20,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  avatarWrap: {
    padding: 10,
    borderRadius: 70,
    backgroundColor: COLORS.bg,
    marginBottom: 16,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  username: { fontSize: 22, fontWeight: '800', color: COLORS.accent },
  sub: { fontSize: 13, color: COLORS.textMuted, marginTop: 4, marginBottom: 20 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 8,
    borderTopColor: COLORS.cardBorder,
    borderTopWidth: 1,
  },
  infoLabel: { fontSize: 13, color: COLORS.textMuted },
  infoValue: { fontSize: 13, color: COLORS.text, maxWidth: '60%' },
  noteCard: {
    marginHorizontal: 20,
    backgroundColor: COLORS.bubbleOwn,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.accentDark,
  },
  noteTitle: { fontSize: 14, fontWeight: '700', color: COLORS.accent, marginBottom: 6 },
  noteText: { fontSize: 13, color: COLORS.textMuted, lineHeight: 20 },
  signOutBtn: {
    margin: 20,
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.danger,
    padding: 16,
    alignItems: 'center',
  },
  signOutText: { color: COLORS.danger, fontWeight: '700', fontSize: 15 },
});
