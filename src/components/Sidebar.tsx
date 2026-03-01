"use client";

import { useUser, SignOutButton } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";

export default function Sidebar({
  onSelectConversation,
}: {
  onSelectConversation: (conversationId: any) => void;
}) {
  const { user } = useUser();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const currentUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  const users = useQuery(api.users.getUsers);

  const conversations = useQuery(
    api.conversations.getUserConversations,
    currentUser ? { userId: currentUser._id } : "skip"
  );

  const allMessages = useQuery(api.messages.getAllMessages);

  const getOrCreateConversation = useMutation(
    api.conversations.getOrCreateConversation
  );

  const updateLastSeen = useMutation(api.users.updateLastSeen);

  // Presence heartbeat
  useEffect(() => {
    if (!currentUser) return;

    updateLastSeen({ userId: currentUser._id });

    const interval = setInterval(() => {
      updateLastSeen({ userId: currentUser._id });
    }, 15000);

    return () => clearInterval(interval);
  }, [currentUser, updateLastSeen]);

  if (!currentUser || !users) {
    return (
      <div className="w-64 h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center border-r border-slate-700/50">
        <div className="flex flex-col items-center">
          <div className="w-6 h-6 border-2 border-slate-600 border-t-cyan-500 rounded-full animate-spin mb-2" />
          <p className="text-xs text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  const otherUsers = users.filter((u) => u._id !== currentUser._id);

  const filteredUsers = otherUsers.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleClick = async (otherUserId: any) => {
    try {
      setLoadingId(otherUserId);

      const conversationId = await getOrCreateConversation({
        user1: currentUser._id,
        user2: otherUserId,
      });

      onSelectConversation(conversationId);
    } catch (error) {
      console.error("Error creating conversation:", error);
    } finally {
      setLoadingId(null);
    }
  };

  const getUnreadCount = (conversationId: any) => {
    if (!conversations || !allMessages) return 0;

    const conversation = conversations.find(
      (c) => c._id === conversationId
    );

    const lastOpened =
      conversation?.lastOpened?.[currentUser._id] || 0;

    return allMessages.filter(
      (m) =>
        m.conversationId === conversationId &&
        m.senderId !== currentUser._id &&
        m.createdAt > lastOpened
    ).length;
  };

  return (
    <div className="w-full h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <h2 className="text-lg font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          Friends
        </h2>

        <div className="relative mb-4 group">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg blur opacity-0 group-focus-within:opacity-100 transition duration-300" />
          <input
            type="text"
            placeholder="Search friends..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="relative w-full bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-400 px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-500/50 focus:bg-slate-700/80 transition duration-200 text-sm"
          />
        </div>

        <div className="space-y-2">
          {filteredUsers.length === 0 && (
            <p className="text-slate-400 text-xs text-center py-4">No friends found</p>
          )}

          {filteredUsers.map((u) => {
            const conversation = conversations?.find((c) =>
              c.members.includes(u._id)
            );

            const unreadCount = conversation
              ? getUnreadCount(conversation._id)
              : 0;

            const isOnline = Date.now() - u.lastSeen < 30000;

            return (
              <button
                key={u._id}
                onClick={() => handleClick(u._id)}
                disabled={loadingId === u._id}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/30 hover:border-slate-600/60 cursor-pointer transition-all duration-200 active:scale-95 disabled:opacity-50"
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={u.imageUrl}
                    alt={u.name}
                    className="w-9 h-9 rounded-full object-cover"
                  />

                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-slate-700 rounded-full animate-pulse" />
                  )}
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {u.name}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {isOnline ? "Online" : "Offline"}
                  </p>
                </div>

                {unreadCount > 0 && (
                  <span className="flex-shrink-0 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg shadow-red-500/50 min-w-fit">
                    {unreadCount}
                  </span>
                )}

                {loadingId === u._id && (
                  <div className="flex-shrink-0 w-4 h-4 border-2 border-slate-500 border-t-cyan-400 rounded-full animate-spin" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-slate-700/50 bg-slate-800/50 backdrop-blur-sm px-3 py-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <img
              src={currentUser.imageUrl}
              alt={currentUser.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-slate-700 rounded-full animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate">
              {currentUser.name}
            </p>
            <p className="text-[11px] text-slate-400">
              Online
            </p>
          </div>

          <SignOutButton>
            <button
              title="Logout"
              className="flex-shrink-0 p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors duration-150 active:scale-90"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
              </svg>
            </button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}
