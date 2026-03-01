import { useState, useEffect, useRef } from 'react';
import { useMessaging, useConversationMessages } from '@/hooks/useMessaging';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ArrowLeft } from 'lucide-react';
import { formatTimeAgo } from '@/lib/forumUtils';
import { useSearchParams, useNavigate } from 'react-router-dom';

export function MessagesPage() {
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { conversations, loading, startConversation, sendMessage, markAsRead } = useMessaging(currentUserId);
  const { messages, loading: messagesLoading } = useConversationMessages(
    selectedConversationId || '',
    currentUserId
  );

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    // Auto-start conversation if user param is present
    const targetUserId = searchParams.get('user');
    if (targetUserId && currentUserId) {
      handleStartConversation(targetUserId);
    }
  }, [searchParams, currentUserId]);

  useEffect(() => {
    if (selectedConversationId) {
      markAsRead(selectedConversationId);
    }
  }, [selectedConversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStartConversation = async (targetUserId: string) => {
    const convId = await startConversation(targetUserId);
    if (convId) {
      setSelectedConversationId(convId);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversationId) return;

    await sendMessage(selectedConversationId, messageInput.trim());
    setMessageInput('');
  };

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Conversations List */}
      <div className={`w-80 border-r flex-shrink-0 ${selectedConversationId ? 'hidden md:block' : ''}`}>
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Messages</h2>
        </div>
        <div className="overflow-y-auto h-[calc(100%-5rem)]">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No conversations yet
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversationId(conv.id)}
                className={`w-full p-4 border-b hover:bg-accent transition-colors text-left ${
                  selectedConversationId === conv.id ? 'bg-accent' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={conv.other_participant?.avatar}
                      alt={conv.other_participant?.username}
                      className="w-12 h-12 rounded-full"
                    />
                    {conv.other_participant?.is_online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold truncate">
                        {conv.other_participant?.username}
                      </h3>
                      {conv.unread_count > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    {conv.last_message && (
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.last_message.content}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatTimeAgo(conv.updated_at)}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Messages View */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <>
            {/* Header */}
            <div className="p-4 border-b flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setSelectedConversationId(null)}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <img
                src={selectedConversation?.other_participant?.avatar}
                alt={selectedConversation?.other_participant?.username}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <h3 className="font-semibold">
                  {selectedConversation?.other_participant?.username}
                </h3>
                {selectedConversation?.other_participant?.is_online && (
                  <p className="text-xs text-green-500">Online</p>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <div className="text-center text-muted-foreground">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground">No messages yet</div>
              ) : (
                messages.map((message) => {
                  const isOwn = message.sender_id === currentUserId;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                        <img
                          src={message.sender?.avatar}
                          alt={message.sender?.username}
                          className="w-8 h-8 rounded-full flex-shrink-0"
                        />
                        <div>
                          <Card
                            className={`p-3 ${
                              isOwn
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="break-words">{message.content}</p>
                          </Card>
                          <p className={`text-xs text-muted-foreground mt-1 ${isOwn ? 'text-right' : ''}`}>
                            {formatTimeAgo(message.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button type="submit" disabled={!messageInput.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}
