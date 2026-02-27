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

  if (!messages) return <div>Loading chat...</div>;

  return (
    <div className="flex flex-col h-screen flex-1">
      {/* Messages */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 relative"
      >
        {messages.length === 0 && (
          <p className="text-gray-500 text-sm">
            No messages yet
          </p>
        )}

        {messages.map((msg) => {
          const isOwn = msg.senderId === currentUserId;
          const reactions = msg.reactions || {};

          return (
            <div
              key={msg._id}
              className={`group flex flex-col ${
                isOwn ? "items-end" : "items-start"
              }`}
            >
              {/* Message Row */}
              <div className="flex items-center gap-2">
                {/* Delete Icon (Own messages only) */}
                {isOwn && !msg.isDeleted && (
                  <div className="opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() =>
                        deleteMessage({
                          messageId: msg._id,
                          userId: currentUserId,
                        })
                      }
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      🗑
                    </button>
                  </div>
                )}

                {/* Bubble */}
                <div
                  className={`p-3 rounded-2xl max-w-xs text-sm ${
                    isOwn
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {msg.isDeleted ? (
                    <i className="opacity-60">
                      This message was deleted
                    </i>
                  ) : (
                    <div>{msg.content}</div>
                  )}

                  <div className="text-[10px] opacity-70 mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>

              {/* Emoji Hover Bar */}
              {!msg.isDeleted && (
                <div className="opacity-0 group-hover:opacity-100 transition flex gap-1 mt-1">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() =>
                        toggleReaction({
                          messageId: msg._id,
                          userId: currentUserId,
                          emoji,
                        })
                      }
                      className="text-lg hover:scale-125 transition"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Reaction Display */}
              {Object.keys(reactions).length > 0 && (
                <div className="flex gap-2 mt-1 text-sm">
                  {Object.entries(reactions).map(
                    ([emoji, users]: any) =>
                      users.length > 0 && (
                        <div
                          key={emoji}
                          onClick={() =>
                            toggleReaction({
                              messageId: msg._id,
                              userId: currentUserId,
                              emoji,
                            })
                          }
                          className={`px-2 py-0.5 rounded-full cursor-pointer ${
                            users.includes(currentUserId)
                              ? "bg-blue-100"
                              : "bg-gray-200"
                          }`}
                        >
                          {emoji} {users.length}
                        </div>
                      )
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Typing Indicator */}
        {typingUsers &&
          typingUsers.some(
            (t) =>
              t.userId !== currentUserId &&
              Date.now() - t.updatedAt < 2000
          ) && (
            <div className="text-sm text-gray-500 italic px-2">
              Typing...
            </div>
          )}

        {/* Scroll Button */}
        {showScrollButton && (
          <button
            onClick={() => {
              bottomRef.current?.scrollIntoView({ behavior: "smooth" });
              setShowScrollButton(false);
            }}
            className="absolute bottom-6 right-6 bg-blue-600 text-white px-3 py-1 rounded-full shadow-lg text-sm"
          >
            ↓ New messages
          </button>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t flex gap-2">
        <input
          className="flex-1 border rounded-lg px-3 py-2"
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
          placeholder="Type a message..."
        />

        <button
          onClick={handleSend}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Send
        </button>
      </div>
    </div>
  );
}