import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { DMMessage } from '../lib/types';
import MessageBubble from '../components/MessageBubble';
import FrogAvatar from '../components/FrogAvatar';
import { useAuth } from '../lib/AuthContext';
import { COLORS } from '../lib/theme';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Route = RouteProp<RootStackParamList, 'DM'>;
type Nav = NativeStackNavigationProp<RootStackParamList, 'DM'>;

export default function DMScreen() {
  const { otherUserId, otherUsername } = useRoute<Route>().params;
  const { profile } = useAuth();
  const navigation = useNavigation<Nav>();

  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    initConversation();
  }, []);

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`dm:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'dm_messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prev) => [payload.new as DMMessage, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  async function initConversation() {
    if (!profile) return;

    // Canonical ordering: smaller id is always user1
    const [u1, u2] = [profile.id, otherUserId].sort();

    let { data: existing } = await supabase
      .from('dm_conversations')
      .select('*')
      .eq('user1_id', u1)
      .eq('user2_id', u2)
      .single();

    if (!existing) {
      const { data: created } = await supabase
        .from('dm_conversations')
        .insert({ user1_id: u1, user2_id: u2 })
        .select()
        .single();
      existing = created;
    }

    if (!existing) return;
    setConversationId(existing.id);
    loadMessages(existing.id);
  }

  async function loadMessages(convId: string) {
    const { data } = await supabase
      .from('dm_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: false })
      .limit(60);

    if (data) setMessages(data);
  }

  async function send() {
    if (!text.trim() || !profile || !conversationId) return;
    setSending(true);
    const { error } = await supabase.from('dm_messages').insert({
      conversation_id: conversationId,
      sender_id: profile.id,
      content: text.trim(),
    });
    if (error) Alert.alert('Error', error.message);
    else setText('');
    setSending(false);
  }

  const renderItem = useCallback(({ item }: { item: DMMessage }) => {
    const isOwn = item.sender_id === profile?.id;
    return (
      <MessageBubble
        message={item}
        isOwn={isOwn}
        username={isOwn ? (profile?.username ?? 'You') : otherUsername}
        userId={item.sender_id}
      />
    );
  }, [profile?.id, profile?.username, otherUsername]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <FrogAvatar userId={otherUserId} size={36} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherUsername}</Text>
          <Text style={styles.headerSub}>Direct Message</Text>
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        inverted
        contentContainerStyle={styles.messageList}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Send a message..."
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
          <Text style={styles.sendText}>💬</Text>
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
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  headerSub: { fontSize: 11, color: COLORS.dm },
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
    backgroundColor: COLORS.dm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendText: { fontSize: 20 },
});
