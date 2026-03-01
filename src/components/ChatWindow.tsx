"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useRef, useEffect } from "react";

export default function ChatWindow({
  conversationId,
  currentUserId,
}: {
  conversationId: any;
  currentUserId: any;
}) {
  // Queries
  const messages = useQuery(
    api.messages.getMessages,
    conversationId ? { conversationId } : "skip"
  );

  const typingUsers = useQuery(
    api.typing.getTypingUsers,
    conversationId ? { conversationId } : "skip"
  );

  // Mutations
  const sendMessage = useMutation(api.messages.sendMessage);
  const updateTyping = useMutation(api.typing.updateTyping);
  const markConversationAsRead = useMutation(
    api.conversations.markConversationAsRead
  );
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const toggleReaction = useMutation(api.messages.toggleReaction);

  const EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

  // State
  const [text, setText] = useState("");
  const [reactionMessageId, setReactionMessageId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Smart auto-scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight -
      container.scrollTop -
      container.clientHeight;

    const isNearBottom = distanceFromBottom < 120;

    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setShowScrollButton(false);
    } else {
      setShowScrollButton(true);
    }
  }, [messages]);

  // Mark conversation as read
  useEffect(() => {
    if (!conversationId) return;

    markConversationAsRead({
      conversationId,
      userId: currentUserId,
    });
  }, [conversationId, currentUserId, markConversationAsRead]);

  const handleSend = async () => {
    if (!text.trim()) return;

    await sendMessage({
      conversationId,
      senderId: currentUserId,
      content: text,
    });

    setText("");
  };

  if (!messages) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-3 border-slate-600 border-t-cyan-500 rounded-full animate-spin mb-3" />
          <p className="text-sm text-slate-400">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen flex-1 bg-gradient-to-b from-slate-800 to-slate-900">
      <div ref={containerRef} className="flex-1 overflow-y-auto pl-0 pr-2 py-4 space-y-3 relative">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <svg
              className="w-16 h-16 mb-4 opacity-30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        )}

        {messages.map((msg) => {
          const isOwn = msg.senderId === currentUserId;
          const reactions = msg.reactions || {};

          return (
            <div
              key={msg._id}
              className={`group flex flex-col ${isOwn ? "items-end" : "items-start"} animate-fadeIn px-2 sm:px-4`}
            >
              <div 
                className={`flex items-end gap-1.5 sm:gap-2 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg ${isOwn ? "flex-row-reverse" : "flex-row"}`}
                onDoubleClick={() => setReactionMessageId(msg._id)}
              >
                {/* Delete Button */}
                {isOwn && !msg.isDeleted && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 mb-1 flex-shrink-0">
                    <button
                      onClick={() =>
                        deleteMessage({
                          messageId: msg._id,
                          userId: currentUserId,
                        })
                      }
                      className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors duration-150 active:scale-90"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed transition-all duration-200 ${
                    isOwn
                      ? "bg-gradient-to-br from-cyan-500 via-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/40 rounded-br-none"
                      : "bg-slate-700/70 text-slate-100 shadow-lg shadow-slate-900/60 rounded-bl-none border border-slate-600/40 backdrop-blur-sm"
                  } break-words whitespace-pre-wrap`}
                >
                  {msg.isDeleted ? (
                    <i className="opacity-60 text-slate-300 text-xs">This message was deleted</i>
                  ) : (
                    <>{msg.content}</>
                  )}
                  
                  <div
                    className={`text-xs mt-1.5 font-medium opacity-75 ${
                      isOwn ? "text-cyan-100" : "text-slate-400"
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>

              {/* Reactions Container */}
              <div className={`flex flex-col gap-1 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mt-1 ${isOwn ? "items-end" : "items-start"}`}>
                {/* Emoji Reactions Bar */}
                {!msg.isDeleted && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 px-2 py-1.5 bg-slate-700/80 rounded-xl backdrop-blur-sm border border-slate-600/60 shadow-lg flex-shrink-0">
                    {EMOJIS.map((emoji, idx) => (
                      <button
                        key={emoji}
                        onClick={() =>
                          toggleReaction({
                            messageId: msg._id,
                            userId: currentUserId,
                            emoji: idx.toString(),
                          })
                        }
                        className="text-lg hover:scale-110 transition-transform duration-150 active:scale-95 p-1 hover:bg-slate-600/50 rounded-lg"
                        title={emoji}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {/* Reaction Display */}
                {Object.keys(reactions).length > 0 && (
                  <div className="flex flex-wrap gap-1 items-center flex-shrink-0">
                    {Object.entries(reactions).map(([emojiIdx, users]: any) =>
                      users.length > 0 ? (
                        <button
                          key={emojiIdx}
                          onClick={() =>
                            toggleReaction({
                              messageId: msg._id,
                              userId: currentUserId,
                              emoji: emojiIdx,
                            })
                          }
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-xs font-medium transition-all duration-150 active:scale-95 backdrop-blur cursor-pointer ${
                            users.includes(currentUserId)
                              ? "bg-cyan-500/40 text-cyan-100 border border-cyan-500/50 shadow-md shadow-cyan-500/20 hover:bg-cyan-500/50"
                              : "bg-slate-700/50 text-slate-300 border border-slate-600/40 shadow-md shadow-slate-900/20 hover:bg-slate-600/70"
                          }`}
                          title={`${users.length} reaction${users.length > 1 ? "s" : ""}`}
                        >
                          <span>{EMOJIS[parseInt(emojiIdx)]}</span>
                          <span className="font-semibold">{users.length}</span>
                        </button>
                      ) : null
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {typingUsers &&
          typingUsers.some(
            (t) =>
              t.userId !== currentUserId && Date.now() - t.updatedAt < 2000
          ) && (
            <div className="text-sm text-slate-400 italic px-2 flex items-center gap-1 animate-pulse">
              <span>Typing</span>
              <span className="flex gap-0.5">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                <span
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </span>
            </div>
          )}

        {showScrollButton && (
          <button
            onClick={() => {
              bottomRef.current?.scrollIntoView({ behavior: "smooth" });
              setShowScrollButton(false);
            }}
            className="fixed bottom-24 right-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-full shadow-lg shadow-blue-500/50 text-sm font-medium hover:shadow-blue-500/75 transition-all duration-200 active:scale-95 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
            New messages
          </button>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-700/50 bg-slate-800/50 backdrop-blur-sm pl-0 pr-2 py-4">
        <div className="flex gap-3 px-4">
          <div className="flex-1 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-300" />
            <input
              className="relative w-full bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-400 px-4 py-3 rounded-xl focus:outline-none focus:border-cyan-500/50 focus:bg-slate-700/80 focus:ring-2 focus:ring-cyan-500/20 transition duration-200 text-sm"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (conversationId) {
                  updateTyping({
                    conversationId,
                    userId: currentUserId,
                  });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message... (Shift+Enter for new line)"
            />
          </div>

          <button
            onClick={handleSend}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/60 hover:scale-105 shadow-md active:scale-95 transition-all duration-200 flex items-center gap-2 flex-shrink-0"
            title="Send message (Enter)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
