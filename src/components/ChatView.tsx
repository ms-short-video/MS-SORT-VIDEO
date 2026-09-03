import React, { useState, useEffect, useRef } from 'react';
import { AuthUser, VideoReel, ChatConversation, DirectMessage, AppNotification } from '../types';
import {
  MessageSquare,
  Search,
  Send,
  ArrowLeft,
  Sparkles,
  Crown,
  CheckCheck,
  Smile,
  Plus,
  Flame,
  Film,
  Bell,
  MoreVertical,
  CheckCircle2,
  Share2,
  Trash2,
} from 'lucide-react';

interface ChatViewProps {
  authUser: AuthUser | null;
  reels: VideoReel[];
  notifications: AppNotification[];
  onOpenNotifications: () => void;
  onWatchReel?: (reel: VideoReel) => void;
}

const DEFAULT_CONVERSATIONS: ChatConversation[] = [
  {
    id: 'conv-1',
    participant: {
      id: 'creator-priya',
      name: 'Priya Sharma',
      username: '@PriyaOfficial',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      isOnline: true,
      isVip: true,
      vipBadge: 'VIP Tier 3',
      isVerified: true,
      lastSeen: 'Active now',
    },
    lastMessage: 'Loved your new short video! Let us collab on the next VIP trending sound 🔥',
    lastMessageTime: '2m ago',
    unreadCount: 2,
    messages: [
      {
        id: 'm1-1',
        senderId: 'creator-priya',
        senderUsername: '@PriyaOfficial',
        senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        text: 'Hey! Are you planning to record on the new Bollywood VIP sound today? 🎬',
        timestamp: '10:42 AM',
        isMine: false,
      },
      {
        id: 'm1-2',
        senderId: 'creator-priya',
        senderUsername: '@PriyaOfficial',
        senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        text: 'Loved your new short video! Let us collab on the next VIP trending sound 🔥',
        timestamp: '10:44 AM',
        isMine: false,
        reactions: ['❤️', '🔥'],
      },
    ],
  },
  {
    id: 'conv-2',
    participant: {
      id: 'creator-aarav',
      name: 'Aarav Patel',
      username: '@AaravVlogs',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      isOnline: true,
      isVip: true,
      vipBadge: 'VIP Tier 2',
      isVerified: true,
      lastSeen: 'Active now',
    },
    lastMessage: 'Sent you a reel to check out! 🎬',
    lastMessageTime: '15m ago',
    unreadCount: 0,
    messages: [
      {
        id: 'm2-1',
        senderId: 'creator-aarav',
        senderUsername: '@AaravVlogs',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
        text: 'Bro, check out this reel camera effect, looks super crisp!',
        timestamp: '9:30 AM',
        isMine: false,
      },
      {
        id: 'm2-2',
        senderId: 'me',
        senderUsername: '@Mehndi_Babu',
        senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        text: 'Yeah man! The beauty filter and audio sync are amazing ✨',
        timestamp: '9:32 AM',
        isMine: true,
      },
    ],
  },
  {
    id: 'conv-3',
    participant: {
      id: 'support-vip',
      name: 'MS Shorts VIP Assistant',
      username: '@VIP_Support',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80',
      isOnline: true,
      isVip: true,
      vipBadge: 'Official Staff',
      isVerified: true,
      lastSeen: 'Always Online',
    },
    lastMessage: 'Welcome to MS Shorts VIP Creator Hub! Your videos are ranking #1 👑',
    lastMessageTime: '1h ago',
    unreadCount: 1,
    messages: [
      {
        id: 'm3-1',
        senderId: 'support-vip',
        senderUsername: '@VIP_Support',
        senderAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80',
        text: 'Welcome to MS Shorts VIP Creator Hub! Your videos are ranking #1 👑 Direct Messages, Cloud Sync and Live Gifts are fully enabled for your account.',
        timestamp: 'Yesterday',
        isMine: false,
      },
    ],
  },
  {
    id: 'conv-4',
    participant: {
      id: 'creator-neha',
      name: 'Neha Kapoor',
      username: '@NehaDance',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
      isOnline: false,
      isVip: false,
      isVerified: false,
      lastSeen: 'Active 2h ago',
    },
    lastMessage: 'Can you share the song link you used in the video?',
    lastMessageTime: '3h ago',
    unreadCount: 0,
    messages: [
      {
        id: 'm4-1',
        senderId: 'creator-neha',
        senderUsername: '@NehaDance',
        senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
        text: 'Can you share the song link you used in the video?',
        timestamp: '7:15 AM',
        isMine: false,
      },
    ],
  },
];

export const ChatView: React.FC<ChatViewProps> = ({
  authUser,
  reels,
  notifications,
  onOpenNotifications,
  onWatchReel,
}) => {
  const [conversations, setConversations] = useState<ChatConversation[]>(() => {
    try {
      const saved = localStorage.getItem('ms_shorts_chat_conversations');
      return saved ? JSON.parse(saved) : DEFAULT_CONVERSATIONS;
    } catch {
      return DEFAULT_CONVERSATIONS;
    }
  });

  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'all' | 'vip' | 'unread'>('all');
  const [inputText, setInputText] = useState<string>('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [showQuickPresets, setShowQuickPresets] = useState<boolean>(false);
  const [isTypingSimulator, setIsTypingSimulator] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Save conversations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ms_shorts_chat_conversations', JSON.stringify(conversations));
    } catch {
      // ignore
    }
  }, [conversations]);

  // Scroll to bottom of message thread
  useEffect(() => {
    if (activeConvId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConvId, conversations]);

  const activeConversation = conversations.find((c) => c.id === activeConvId);

  const unreadNotifsCount = notifications.filter((n) => n.isUnread).length;
  const totalUnreadMessages = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const quickEmojis = ['❤️', '🔥', '😂', '✨', '👑', '🎬', '👏', '🎉', '💯', '🚀'];
  const quickMessagePresets = [
    'Hey! Loved your latest VIP reel! 🔥',
    'Let us collab on this trending sound! 🎬',
    'Which camera filter did you use in that video? ✨',
    'Awesome content, keep it up! 👑',
    'Check out my new video on the feed! 🚀',
  ];

  // Open conversation & mark as read
  const handleOpenConversation = (convId: string) => {
    setActiveConvId(convId);
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
    );
  };

  // Send message in active chat
  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !activeConvId) return;

    const myAvatar =
      authUser?.photoURL ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80';
    const myUsername = authUser?.username || '@Mehndi_Babu';
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: DirectMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderId: authUser?.uid || 'me',
      senderUsername: myUsername,
      senderAvatar: myAvatar,
      text,
      timestamp: nowTime,
      isMine: true,
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConvId) {
          return {
            ...c,
            lastMessage: text,
            lastMessageTime: 'Just now',
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      })
    );

    setInputText('');
    setShowEmojiPicker(false);
    setShowQuickPresets(false);

    // Realistic auto-reply simulation for VIP Creator interactions
    if (activeConversation) {
      setIsTypingSimulator(true);
      const participantName = activeConversation.participant.name;
      const targetConvId = activeConvId;

      setTimeout(() => {
        setIsTypingSimulator(false);
        const autoReplies = [
          `Thanks for the message! ❤️ I really appreciate your support on MS Shorts!`,
          `Awesome! Let's definitely create more videos together! ✨🎬`,
          `Check out my latest reel on the home feed and drop a comment! 🚀`,
          `Got your message! Hope you are having a wonderful day creating content! 👑`,
        ];
        const replyText = autoReplies[Math.floor(Math.random() * autoReplies.length)];
        const replyMsg: DirectMessage = {
          id: `msg-reply-${Date.now()}`,
          senderId: activeConversation.participant.id,
          senderUsername: activeConversation.participant.username,
          senderAvatar: activeConversation.participant.avatar,
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMine: false,
        };

        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === targetConvId) {
              return {
                ...c,
                lastMessage: replyText,
                lastMessageTime: 'Just now',
                messages: [...c.messages, replyMsg],
              };
            }
            return c;
          })
        );
      }, 1600);
    }
  };

  // Add emoji reaction to message
  const handleReactToMessage = (msgId: string, emoji: string) => {
    if (!activeConvId) return;
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConvId) {
          return {
            ...c,
            messages: c.messages.map((m) => {
              if (m.id === msgId) {
                const current = m.reactions || [];
                const updated = current.includes(emoji)
                  ? current.filter((r) => r !== emoji)
                  : [...current, emoji];
                return { ...m, reactions: updated };
              }
              return m;
            }),
          };
        }
        return c;
      })
    );
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      c.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.participant.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterTab === 'vip') return c.participant.isVip;
    if (filterTab === 'unread') return c.unreadCount > 0;
    return true;
  });

  return (
    <div className="w-full h-full bg-slate-950 text-white flex flex-col relative pb-20 select-none">
      {/* ========================================================================= */}
      {/* VIEW 1: ACTIVE CHAT CONVERSATION THREAD */}
      {/* ========================================================================= */}
      {activeConvId && activeConversation ? (
        <div className="w-full h-full flex flex-col bg-slate-950 animate-fade-in relative z-20">
          {/* Chat Header */}
          <div className="flex items-center justify-between px-3.5 py-3 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-xl shrink-0">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setActiveConvId(null)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition-colors active:scale-95"
                title="Back to inbox"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="relative">
                <img
                  src={activeConversation.participant.avatar}
                  alt={activeConversation.participant.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-700 ring-2 ring-pink-500/30"
                />
                {activeConversation.participant.isOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-black text-white">{activeConversation.participant.name}</h3>
                  {activeConversation.participant.isVerified && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 fill-blue-400/20" />
                  )}
                  {activeConversation.participant.isVip && (
                    <span className="p-0.5 rounded-full bg-amber-500/20 text-amber-400">
                      <Crown className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span className="font-mono">{activeConversation.participant.username}</span>
                  <span>•</span>
                  <span className={activeConversation.participant.isOnline ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                    {activeConversation.participant.lastSeen || 'Active now'}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  // Quick preset collaboration greeting
                  handleSendMessage('Hey! Let us collaborate on a new VIP short video! 🎬✨');
                }}
                className="p-2 rounded-xl bg-pink-600/20 text-pink-400 hover:bg-pink-600 hover:text-white border border-pink-500/30 text-[10px] font-bold transition-all flex items-center gap-1 active:scale-95"
                title="Send VIP Collab Request"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Collab</span>
              </button>
            </div>
          </div>

          {/* Message Thread Scroll Area */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-none">
            {/* Encryption & Safety Badge */}
            <div className="flex justify-center my-1">
              <div className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[10px] text-slate-400 flex items-center gap-1.5">
                <Crown className="w-3 h-3 text-pink-400" />
                <span>Protected VIP Direct Messaging Channel</span>
              </div>
            </div>

            {activeConversation.messages.map((msg) => {
              const isMine = msg.isMine;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col group ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-end gap-2 max-w-[82%]">
                    {!isMine && (
                      <img
                        src={msg.senderAvatar}
                        alt="sender"
                        className="w-6 h-6 rounded-full object-cover border border-slate-700 shrink-0 mb-1"
                      />
                    )}

                    <div className="flex flex-col">
                      <div
                        className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed relative ${
                          isMine
                            ? 'bg-gradient-to-r from-pink-600 to-indigo-600 text-white rounded-br-none shadow-md shadow-pink-600/20'
                            : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none'
                        }`}
                      >
                        <p className="break-words">{msg.text}</p>

                        {/* Shared Reel Inside Message */}
                        {msg.reelShared && (
                          <div
                            onClick={() => {
                              if (onWatchReel) {
                                const target = reels.find((r) => r.id === msg.reelShared?.id);
                                if (target) onWatchReel(target);
                              }
                            }}
                            className="mt-2 p-2 rounded-xl bg-black/40 border border-white/20 flex items-center gap-2.5 cursor-pointer hover:bg-black/60 transition-colors"
                          >
                            <div className="w-10 h-14 rounded-lg bg-slate-800 flex items-center justify-center relative overflow-hidden shrink-0">
                              <Film className="w-5 h-5 text-pink-400" />
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-[11px] font-bold text-white truncate">
                                {msg.reelShared.caption || 'Shared Short Reel'}
                              </p>
                              <span className="text-[9px] text-pink-300 flex items-center gap-1 font-bold">
                                <Sparkles className="w-2.5 h-2.5" /> Tap to play
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Timestamp & Read Receipt */}
                        <div
                          className={`flex items-center gap-1 mt-1 text-[9px] ${
                            isMine ? 'text-pink-200/80 justify-end' : 'text-slate-500 justify-start'
                          }`}
                        >
                          <span>{msg.timestamp}</span>
                          {isMine && <CheckCheck className="w-3 h-3 text-pink-200" />}
                        </div>
                      </div>

                      {/* Display Reactions */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="flex items-center gap-1 -mt-1.5 px-2">
                          {msg.reactions.map((emoji, idx) => (
                            <span
                              key={idx}
                              onClick={() => handleReactToMessage(msg.id, emoji)}
                              className="text-xs px-1.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 shadow-sm cursor-pointer hover:scale-110 transition-transform"
                            >
                              {emoji}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Hover Emoji Reaction Bar */}
                      <div
                        className={`opacity-0 group-hover:opacity-100 flex items-center gap-1 pt-1 transition-opacity ${
                          isMine ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {['❤️', '🔥', '😂', '👍'].map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleReactToMessage(msg.id, emoji)}
                            className="p-1 text-xs hover:scale-125 transition-transform"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTypingSimulator && (
              <div className="flex items-center gap-2 text-slate-400 text-xs pl-8">
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-3 py-2 rounded-2xl">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[10px] text-slate-400 ml-1 font-medium">
                    {activeConversation.participant.name} is typing...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Preset Message Chips Drawer */}
          {showQuickPresets && (
            <div className="px-3 py-2 bg-slate-900 border-t border-slate-800 flex flex-wrap gap-1.5 animate-slide-up">
              {quickMessagePresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(preset)}
                  className="px-2.5 py-1 rounded-full bg-slate-950 hover:bg-pink-600 hover:text-white border border-slate-800 text-slate-300 text-[10px] font-medium transition-all"
                >
                  {preset}
                </button>
              ))}
            </div>
          )}

          {/* Emoji Picker Row */}
          {showEmojiPicker && (
            <div className="px-3 py-2 bg-slate-900 border-t border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none animate-slide-up">
              {quickEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setInputText((prev) => prev + emoji)}
                  className="text-lg p-1.5 hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Chat Input Bar */}
          <div className="p-3 border-t border-slate-800 bg-slate-900/95 backdrop-blur-xl shrink-0 flex items-center gap-2">
            <button
              onClick={() => setShowQuickPresets((prev) => !prev)}
              className={`p-2 rounded-xl border transition-all ${
                showQuickPresets
                  ? 'bg-pink-600 text-white border-pink-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Quick Message Presets"
            >
              <Sparkles className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className={`p-2 rounded-xl border transition-all ${
                showEmojiPicker
                  ? 'bg-amber-600 text-white border-amber-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Emoji Picker"
            >
              <Smile className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              placeholder={`Message ${activeConversation.participant.name}...`}
              className="flex-1 px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
              className="p-2.5 rounded-2xl bg-gradient-to-r from-pink-600 to-indigo-600 text-white disabled:opacity-40 disabled:scale-100 hover:scale-105 active:scale-95 shadow-md shadow-pink-600/30 transition-all"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW 2: INBOX & ALL CONVERSATIONS LIST */
        /* ========================================================================= */
        <div className="w-full h-full flex flex-col overflow-y-auto scrollbar-none">
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                    <span>Direct Messages</span>
                    {totalUnreadMessages > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-pink-600 text-white text-[10px] font-black">
                        {totalUnreadMessages}
                      </span>
                    )}
                  </h1>
                  <p className="text-[11px] text-slate-400">Chat with creators, VIPs & friends</p>
                </div>
              </div>

              {/* Top Shortcut to Notifications & Alerts */}
              <button
                onClick={onOpenNotifications}
                className="p-2 rounded-2xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all relative active:scale-95"
                title="System Notifications & Alerts"
              >
                <Bell className="w-4 h-4 text-indigo-300" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink-500 text-white text-[9px] font-black flex items-center justify-center animate-bounce">
                    {unreadNotifsCount}
                  </span>
                )}
              </button>
            </div>

            {/* Search Conversations Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search creator name or username..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 pt-2.5">
              <button
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  filterTab === 'all'
                    ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                All Chats
              </button>
              <button
                onClick={() => setFilterTab('vip')}
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${
                  filterTab === 'vip'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                <Crown className="w-3 h-3" />
                <span>VIP Creators</span>
              </button>
              <button
                onClick={() => setFilterTab('unread')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  filterTab === 'unread'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                Unread
              </button>
            </div>
          </div>

          {/* Active Now / Online Creators Row */}
          <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-950 shrink-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
              Online Creators
            </span>
            <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
              {conversations
                .filter((c) => c.participant.isOnline)
                .map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleOpenConversation(c.id)}
                    className="flex flex-col items-center gap-1 cursor-pointer group shrink-0"
                  >
                    <div className="relative">
                      <img
                        src={c.participant.avatar}
                        alt={c.participant.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-pink-500 group-hover:scale-105 transition-transform shadow-md shadow-pink-500/20"
                      />
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
                    </div>
                    <span className="text-[10px] text-slate-300 font-medium max-w-[55px] truncate">
                      {c.participant.name.split(' ')[0]}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 px-3 py-2 divide-y divide-slate-900">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
                <MessageSquare className="w-10 h-10 mb-2 opacity-40 text-pink-400" />
                <p className="text-xs font-bold text-slate-400">No conversations found</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Try searching a different name or start chatting with a creator!</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleOpenConversation(conv.id)}
                  className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all active:scale-[0.98] ${
                    conv.unreadCount > 0
                      ? 'bg-pink-600/10 border border-pink-500/20 hover:bg-pink-600/20'
                      : 'hover:bg-slate-900'
                  }`}
                >
                  {/* Avatar & Online Dot */}
                  <div className="relative shrink-0">
                    <img
                      src={conv.participant.avatar}
                      alt={conv.participant.name}
                      className="w-12 h-12 rounded-full object-cover border border-slate-700"
                    />
                    {conv.participant.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
                    )}
                  </div>

                  {/* Message Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <h4 className="text-xs font-extrabold text-white truncate">
                          {conv.participant.name}
                        </h4>
                        {conv.participant.isVerified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 fill-blue-400/20 shrink-0" />
                        )}
                        {conv.participant.isVip && (
                          <span className="p-0.5 rounded-full bg-amber-500/20 text-amber-400 shrink-0">
                            <Crown className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 shrink-0">{conv.lastMessageTime}</span>
                    </div>

                    <p
                      className={`text-xs truncate ${
                        conv.unreadCount > 0 ? 'text-pink-300 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {conv.lastMessage}
                    </p>
                  </div>

                  {/* Unread Pill */}
                  {conv.unreadCount > 0 && (
                    <div className="shrink-0 w-5 h-5 rounded-full bg-pink-600 text-white text-[10px] font-black flex items-center justify-center shadow-md shadow-pink-600/40 animate-pulse">
                      {conv.unreadCount}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
