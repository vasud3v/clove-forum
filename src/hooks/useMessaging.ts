import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/forum/Toast';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  edited_at?: string;
  sender?: {
    id: string;
    username: string;
    avatar: string;
  };
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  unread_count: number;
  last_message?: Message;
  other_participant?: {
    id: string;
    username: string;
    avatar: string;
    is_online: boolean;
  };
}

export function useMessaging(currentUserId: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUserId) return;
    
    fetchConversations();
    
    // Subscribe to new messages
    const channel = supabase
      .channel(`messages-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_participants',
          filter: `user_id=eq.${currentUserId}`
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const fetchConversations = async () => {
    try {
      // Get user's conversations
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          unread_count,
          last_read_at,
          conversations (
            id,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', currentUserId)
        .order('last_read_at', { ascending: false });

      if (participantError) throw participantError;

      // For each conversation, get the other participant and last message
      const conversationsWithDetails = await Promise.all(
        (participantData || []).map(async (p: any) => {
          const convId = p.conversation_id;
          
          // Get other participant
          const { data: otherParticipant } = await supabase
            .from('conversation_participants')
            .select(`
              user_id,
              forum_users (
                id,
                username,
                avatar,
                is_online
              )
            `)
            .eq('conversation_id', convId)
            .neq('user_id', currentUserId)
            .single();

          // Get last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select(`
              *,
              sender:forum_users!messages_sender_id_fkey (
                id,
                username,
                avatar
              )
            `)
            .eq('conversation_id', convId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            id: p.conversations.id,
            created_at: p.conversations.created_at,
            updated_at: p.conversations.updated_at,
            unread_count: p.unread_count,
            last_message: lastMessage,
            other_participant: otherParticipant?.forum_users
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const startConversation = async (targetUserId: string): Promise<string | null> => {
    setLoading(true);
    try {
      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUserId);

      if (existingConv) {
        for (const conv of existingConv) {
          const { data: otherParticipant } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conv.conversation_id)
            .eq('user_id', targetUserId)
            .maybeSingle();

          if (otherParticipant) {
            return conv.conversation_id;
          }
        }
      }

      // Check if user can message target
      const { data: canMessage } = await supabase
        .rpc('can_message_user', { target_user_id: targetUserId });

      if (!canMessage) {
        toast.error('You need to follow this user to send them a message');
        return null;
      }

      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({})
        .select()
        .single();

      if (convError) throw convError;

      // Add participants
      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: newConv.id, user_id: currentUserId },
          { conversation_id: newConv.id, user_id: targetUserId }
        ]);

      if (participantError) throw participantError;

      fetchConversations();
      return newConv.id;
    } catch (error: any) {
      toast.error(error.message || 'Failed to start conversation');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (conversationId: string, content: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content
        });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      await supabase
        .from('conversation_participants')
        .update({ 
          last_read_at: new Date().toISOString(),
          unread_count: 0
        })
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUserId);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  return {
    conversations,
    loading,
    startConversation,
    sendMessage,
    markAsRead,
    refreshConversations: fetchConversations
  };
}

export function useConversationMessages(conversationId: string, currentUserId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!conversationId) return;
    
    fetchMessages();
    
    // Subscribe to new messages
    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:forum_users!messages_sender_id_fkey (
            id,
            username,
            avatar
          )
        `)
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  return { messages, loading, refreshMessages: fetchMessages };
}
