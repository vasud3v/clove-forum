import { useState, useEffect, useRef } from 'react';
import { useMessagingEnhanced, useConversationMessagesEnhanced } from '@/hooks/useMessagingEnhanced';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ArrowLeft, Pin, BellOff, Trash2, MoreVertical, Reply, Edit2, Check, X, Settings } from 'lucide-react';
import { formatTimeAgo } from '@/lib/forumUtils';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MessageSettingsModal } from './MessageSettingsModal';

export function MessagesPage() {
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [replyToMessage, setReplyToMessage] = useState<any>(null);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [editContent, setEditContent] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { 
    conversations, 
    loading, 
    startConversation, 
    sendMessage, 
    editMessage,
    deleteMessage,
    markAsRead,
    toggleMute,
    togglePin,
    deleteConversation
  } = useMessagingEnhanced(currentUserId);
  
  const { 
    messages, 
    loading: messagesLoading,
    hasMore,
    loadMore
  } = useConversationMessagesEnhanced(
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

    await sendMessage(selectedConversationId, messageInput.trim(), replyToMessage?.id);
    setMessageInput('');
    setReplyToMessage(null);
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editContent.trim()) return;
    await editMessage(messageId, editContent.trim());
    setEditingMessage(null);
    setEditContent('');
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (confirm('Delete this message?')) {
      await deleteMessage(messageId);
    }
  };

  const handleDeleteConversation = async (convId: string) => {
    if (confirm('Delete this conversation? This cannot be undone.')) {
      await deleteConversation(convId);
      setSelectedConversationId(null);
    }
  };

  const canEditMessage = (message: any) => {
    if (message.sender_id !== currentUserId) return false;
    const messageTime = new Date(message.created_at).getTime();
    const now = Date.now();
    const hoursSince = (now - messageTime) / (1000 * 60 * 60);
    return hoursSince < 24;
  };

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Conversations List */}
      <div className={`w-80 border-r flex-shrink-0 ${selectedConversationId ? 'hidden md:block' : ''}`}>
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">Messages</h2>
          <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
            <Settings className="w-4 h-4" />
          </Button>
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
                className={`w-full p-4 border-b hover:bg-accent transition-colors text-left relative ${
                  selectedConversationId === conv.id ? 'bg-accent' : ''
                }`}
              >
                {conv.is_pinned && (
                  <Pin className="w-3 h-3 absolute top-2 right-2 text-primary" />
                )}
                {conv.is_muted && (
                  <BellOff className="w-3 h-3 absolute top-2 right-8 text-muted-foreground" />
                )}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={conv.other_participant?.avatar}
                      alt={conv.other_participant?.username}
                      className="w-12 h-12 "
                    />
                    {conv.other_participant?.is_online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500  border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold truncate">
                        {conv.other_participant?.username}
                      </h3>
                      {conv.unread_count > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs  px-2 py-0.5">
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
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
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
                  className="w-10 h-10 "
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
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => togglePin(selectedConversationId!, selectedConversation?.is_pinned || false)}
                  >
                    <Pin className="w-4 h-4 mr-2" />
                    {selectedConversation?.is_pinned ? 'Unpin' : 'Pin'} Conversation
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => toggleMute(selectedConversationId!, selectedConversation?.is_muted || false)}
                  >
                    <BellOff className="w-4 h-4 mr-2" />
                    {selectedConversation?.is_muted ? 'Unmute' : 'Mute'} Conversation
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDeleteConversation(selectedConversationId!)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Conversation
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {hasMore && (
                <div className="text-center">
                  <Button variant="ghost" size="sm" onClick={loadMore} disabled={messagesLoading}>
                    Load More
                  </Button>
                </div>
              )}
              {messagesLoading && messages.length === 0 ? (
                <div className="text-center text-muted-foreground">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground">No messages yet</div>
              ) : (
                messages.map((message) => {
                  const isOwn = message.sender_id === currentUserId;
                  const isEditing = editingMessage?.id === message.id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                        <img
                          src={message.sender?.avatar}
                          alt={message.sender?.username}
                          className="w-8 h-8  flex-shrink-0"
                        />
                        <div className="flex-1">
                          {message.reply_to && (
                            <div className="text-xs text-muted-foreground mb-1 p-2 bg-muted/50 rounded">
                              Replying to {message.reply_to.sender?.username}: {message.reply_to.content.substring(0, 50)}...
                            </div>
                          )}
                          
                          {isEditing ? (
                            <div className="space-y-2">
                              <Input
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="text-sm"
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleEditMessage(message.id)}>
                                  <Check className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => {
                                  setEditingMessage(null);
                                  setEditContent('');
                                }}>
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <Card
                                className={`p-3 ${
                                  isOwn
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                <p className="break-words">{message.content}</p>
                                {message.edited_at && (
                                  <p className="text-xs opacity-70 mt-1">(edited)</p>
                                )}
                              </Card>
                              <div className={`flex items-center gap-2 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                                <p className="text-xs text-muted-foreground">
                                  {formatTimeAgo(message.created_at)}
                                </p>
                                {!isOwn && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2"
                                    onClick={() => setReplyToMessage(message)}
                                  >
                                    <Reply className="w-3 h-3" />
                                  </Button>
                                )}
                                {isOwn && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-6 px-2">
                                        <MoreVertical className="w-3 h-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {canEditMessage(message) && (
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setEditingMessage(message);
                                            setEditContent(message.content);
                                          }}
                                        >
                                          <Edit2 className="w-3 h-3 mr-2" />
                                          Edit
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem
                                        onClick={() => handleDeleteMessage(message.id)}
                                        className="text-destructive"
                                      >
                                        <Trash2 className="w-3 h-3 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            </>
                          )}
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
              {replyToMessage && (
                <div className="mb-2 p-2 bg-muted rounded flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Replying to:</span> {replyToMessage.content.substring(0, 50)}...
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyToMessage(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                  maxLength={5000}
                />
                <Button type="submit" disabled={!messageInput.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {messageInput.length}/5000
              </p>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a conversation to start messaging
          </div>
        )}
      </div>
      
      <MessageSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentUserId={currentUserId}
      />
    </div>
  );
}
