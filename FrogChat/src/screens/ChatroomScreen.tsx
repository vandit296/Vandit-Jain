import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { Message, Profile } from '../lib/types';
import MessageBubble from '../components/MessageBubble';
import { useAuth } from '../lib/AuthContext';
import { COLORS } from '../lib/theme';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Route = RouteProp<RootStackParamList, 'Chatroom'>;
type Nav = NativeStackNavigationProp<RootStackParamList, 'Chatroom'>;

const PAGE_SIZE = 40;

export default function ChatroomScreen() {
  const { room } = useRoute<Route>().params;
  const { profile } = useAuth();
  const navigation = useNavigation<Nav>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel(`chatroom:${room.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chatroom_id=eq.${room.id}` },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => [msg, ...prev]);
          fetchProfileIfNeeded(msg.sender_id);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [room.id]);

  async function loadMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('chatroom_id', room.id)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (data) {
      setMessages(data);
      const ids = [...new Set(data.map((m) => m.sender_id))];
      fetchProfiles(ids);
    }
  }

  async function fetchProfiles(ids: string[]) {
    const toFetch = ids.filter((id) => !profiles[id]);
    if (!toFetch.length) return;
    const { data } = await supabase.from('profiles').select('*').in('id', toFetch);
    if (data) {
      setProfiles((prev) => {
        const next = { ...prev };
        data.forEach((p) => { next[p.id] = p; });
        return next;
      });
    }
  }

  async function fetchProfileIfNeeded(id: string) {
    if (profiles[id]) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (data) setProfiles((prev) => ({ ...prev, [id]: data }));
  }

  async function send() {
    if (!text.trim() || !profile) return;
    setSending(true);
    const { error } = await supabase.from('messages').insert({
      chatroom_id: room.id,
      sender_id: profile.id,
      content: text.trim(),
    });
    if (error) Alert.alert('Error', error.message);
    else setText('');
    setSending(false);
  }

  function handleAvatarPress(userId: string, username: string) {
    if (!profile || userId === profile.id) return;
    Alert.alert(
      `${username}`,
      'Send a direct message?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'DM', onPress: () => navigation.navigate('DM', { otherUserId: userId, otherUsername: username }) },
      ]
    );
  }

  const renderItem = useCallback(({ item }: { item: Message }) => {
    const sender = profiles[item.sender_id];
    return (
      <MessageBubble
        message={item}
        isOwn={item.sender_id === profile?.id}
        username={sender?.username ?? '...'}
        userId={item.sender_id}
        onAvatarPress={handleAvatarPress}
      />
    );
  }, [profiles, profile?.id]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.roomEmoji}>{room.emoji}</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.roomName}>{room.name}</Text>
          <Text style={styles.roomTopic}>{room.description}</Text>
        </View>
      </View>

      {/* Messages — inverted so newest is at bottom */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        inverted
        contentContainerStyle={styles.messageList}
      />

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Ribbit something..."
          placeholderTextColor={COLORS.textMuted}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={send}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={send}
          disabled={!text.trim() || sending}
        >
          <Text style={styles.sendText}>🐸</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  back: { paddingRight: 4 },
  backText: { fontSize: 32, color: COLORS.text, lineHeight: 36 },
  roomEmoji: { fontSize: 28 },
  headerInfo: { flex: 1 },
  roomName: { fontSize: 17, fontWeight: '700', color: COLORS.text, textTransform: 'capitalize' },
  roomTopic: { fontSize: 12, color: COLORS.textMuted },
  messageList: { paddingVertical: 8, flexGrow: 1 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    backgroundColor: COLORS.card,
    borderTopColor: COLORS.cardBorder,
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.bubble,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendText: { fontSize: 20 },
});
