import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Animated,
} from 'react-native';
import FrogAvatar from '../components/FrogAvatar';
import { useAuth } from '../lib/AuthContext';
import { COLORS } from '../lib/theme';

export default function SplashScreen() {
  const { signInAnonymously } = useAuth();
  const [loading, setLoading] = useState(false);
  const [previewId] = useState(() => Math.random().toString(36).slice(2));
  const [error, setError] = useState('');

  async function handleJoin() {
    setLoading(true);
    setError('');
    try {
      await signInAnonymously();
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🐸 FrogChat</Text>
      <Text style={styles.subtitle}>Jump into the pond. No signup required.</Text>

      <View style={styles.avatarContainer}>
        <FrogAvatar userId={previewId} size={140} />
      </View>

      <Text style={styles.hint}>
        You'll get a random frog avatar and a secret username.{'\n'}
        No one knows who you are — just vibe.
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleJoin} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Jump In 🐸</Text>
        }
      </TouchableOpacity>

      <Text style={styles.fine}>Anonymous. Fun. Ribbit.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: COLORS.accent,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  avatarContainer: {
    marginVertical: 36,
    padding: 12,
    backgroundColor: COLORS.card,
    borderRadius: 80,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  hint: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  button: {
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 40,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  fine: {
    marginTop: 24,
    fontSize: 12,
    color: COLORS.textMuted,
    opacity: 0.6,
  },
  error: {
    color: COLORS.danger,
    marginBottom: 12,
    fontSize: 13,
  },
});
