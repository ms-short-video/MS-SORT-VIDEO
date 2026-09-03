import React, { useState } from 'react';
import { VideoReel, VideoComment } from '../types';
import { X, Send, Heart, Gift, Sparkles } from 'lucide-react';

interface CommentDrawerProps {
  reel: VideoReel | null;
  comments: VideoComment[];
  onClose: () => void;
  onAddComment: (text: string) => void;
  onLikeComment: (id: string) => void;
  onOpenGiftModal?: (reel: VideoReel) => void;
}

export const CommentDrawer: React.FC<CommentDrawerProps> = ({
  reel,
  comments,
  onClose,
  onAddComment,
  onLikeComment,
  onOpenGiftModal,
}) => {
  const [inputText, setInputText] = useState('');

  if (!reel) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onAddComment(inputText.trim());
    setInputText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg mx-auto h-[65vh] bg-slate-900 border-t border-slate-700 rounded-t-3xl flex flex-col shadow-2xl text-white overflow-hidden animate-slide-up">
        {/* Drawer Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">Comments & Gifts</span>
            <span className="text-xs text-slate-400 font-mono">({comments.length})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs">
              Be the first to leave a comment or send a gift!
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className={`flex items-start justify-between gap-3 text-xs p-2 rounded-2xl transition-all ${
                  comment.isGiftComment
                    ? 'bg-gradient-to-r from-amber-500/15 via-pink-500/15 to-purple-500/15 border border-amber-500/30'
                    : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={comment.avatar}
                      alt={comment.username}
                      className="w-8 h-8 rounded-full object-cover border border-slate-700"
                    />
                    {comment.isGiftComment && (
                      <span className="absolute -bottom-1 -right-1 text-xs">
                        {comment.giftDetails?.giftIcon || '🎁'}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-200">@{comment.username}</span>
                      {comment.isVip && (
                        <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                          comment.vipLevel === 3
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40'
                            : comment.vipLevel === 2
                            ? 'bg-pink-500/20 text-pink-300 border border-pink-400/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                        }`}>
                          {comment.vipLevel === 3 ? '🔥 VIP 3' : comment.vipLevel === 2 ? '💎 VIP KING' : '👑 VIP 1'}
                        </span>
                      )}
                      {comment.isGiftComment && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black text-[9px] border border-amber-500/30">
                          GIFT SUPPORTER 👑
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500">{comment.timeAgo}</span>
                    </div>
                    <p className={`leading-snug ${comment.isGiftComment ? 'text-amber-200 font-bold' : 'text-slate-300'}`}>
                      {comment.text}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onLikeComment(comment.id)}
                  className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-pink-500 transition-colors shrink-0"
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      comment.isLiked ? 'text-pink-500 fill-pink-500' : ''
                    }`}
                  />
                  <span className="text-[10px] font-mono">{comment.likes}</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Comment Input Box with Quick Gift Button */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
          {onOpenGiftModal && (
            <button
              type="button"
              onClick={() => onOpenGiftModal(reel)}
              className="p-2.5 rounded-full bg-gradient-to-tr from-amber-500 to-pink-500 text-white shadow-md hover:scale-105 active:scale-95 transition-all shrink-0"
              title="Send Gift to Creator"
            >
              <Gift className="w-4 h-4" />
            </button>
          )}

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Add a comment as @Mehndi_Babu..."
            className="flex-1 px-4 py-2 rounded-full bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-pink-500"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-full bg-pink-600 hover:bg-pink-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

