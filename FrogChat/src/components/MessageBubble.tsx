import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import FrogAvatar from './FrogAvatar';
import { Message, DMMessage } from '../lib/types';
import { COLORS } from '../lib/theme';

type Props = {
  message: Message | DMMessage;
  isOwn: boolean;
  username: string;
  userId: string;
  onAvatarPress?: (userId: string, username: string) => void;
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message, isOwn, username, userId, onAvatarPress }: Props) {
  return (
    <View style={[styles.row, isOwn && styles.rowOwn]}>
      {!isOwn && (
        <TouchableOpacity onPress={() => onAvatarPress?.(userId, username)}>
          <FrogAvatar userId={userId} size={36} />
        </TouchableOpacity>
      )}
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        {!isOwn && <Text style={styles.username}>{username}</Text>}
        <Text style={styles.content}>{message.content}</Text>
        <Text style={styles.time}>{formatTime(message.created_at)}</Text>
      </View>
      {isOwn && <FrogAvatar userId={userId} size={36} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 4,
    paddingHorizontal: 12,
    gap: 8,
  },
  rowOwn: { flexDirection: 'row-reverse' },
  bubble: {
    maxWidth: '72%',
    borderRadius: 16,
    padding: 10,
    paddingHorizontal: 14,
  },
  bubbleOther: {
    backgroundColor: COLORS.bubble,
    borderBottomLeftRadius: 4,
  },
  bubbleOwn: {
    backgroundColor: COLORS.bubbleOwn,
    borderBottomRightRadius: 4,
  },
  username: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
    marginBottom: 3,
  },
  content: { fontSize: 15, color: COLORS.text, lineHeight: 20 },
  time: {
    fontSize: 10,
    color: COLORS.textMuted,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
});
