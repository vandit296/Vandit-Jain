import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { DMConversation, Profile, DMMessage } from '../lib/types';
import FrogAvatar from '../components/FrogAvatar';
import { useAuth } from '../lib/AuthContext';
import { COLORS } from '../lib/theme';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList, 'DMList'>;

export default function DMListScreen() {
  const { profile } = useAuth();
  const navigation = useNavigation<Nav>();
  const [convos, setConvos] = useState<(DMConversation & { other_user: Profile; last_message?: DMMessage })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    loadConversations();
  }, [profile?.id]);

  async function loadConversations() {
    if (!profile) return;
    setLoading(true);

    const { data: rawConvos } = await supabase
      .from('dm_conversations')
      .select('*')
      .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
      .order('created_at', { ascending: false });

    if (!rawConvos) { setLoading(false); return; }

    const otherIds = rawConvos.map((c) =>
      c.user1_id === profile.id ? c.user2_id : c.user1_id
    );

    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .in('id', otherIds);

    const profileMap: Record<string, Profile> = {};
    profilesData?.forEach((p) => { profileMap[p.id] = p; });

    // Fetch last message per conversation
    const enriched = await Promise.all(
      rawConvos.map(async (c) => {
        const otherId = c.user1_id === profile.id ? c.user2_id : c.user1_id;
        const { data: lastMsg } = await supabase
          .from('dm_messages')
          .select('*')
          .eq('conversation_id', c.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return { ...c, other_user: profileMap[otherId], last_message: lastMsg ?? undefined };
      })
    );

    setConvos(enriched);
    setLoading(false);
  }

  if (!convos.length && !loading) {
    return (
      <View style={styles.empty}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.emptyEmoji}>💬</Text>
        <Text style={styles.emptyTitle}>No DMs yet</Text>
        <Text style={styles.emptyHint}>
          Tap on someone's frog avatar in a chatroom to start a DM.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Direct Messages</Text>
      </View>

      <FlatList
        data={convos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.convoCard}
            onPress={() =>
              navigation.navigate('DM', {
                otherUserId: item.other_user.id,
                otherUsername: item.other_user.username,
              })
            }
          >
            <FrogAvatar userId={item.other_user.id} size={48} />
            <View style={styles.convoInfo}>
              <Text style={styles.convoName}>{item.other_user.username}</Text>
              <Text style={styles.convoLast} numberOfLines={1}>
                {item.last_message?.content ?? 'No messages yet'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
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
  list: { padding: 16 },
  convoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 14,
  },
  convoInfo: { flex: 1 },
  convoName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  convoLast: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  empty: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyEmoji: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  emptyHint: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 },
});
