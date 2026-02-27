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

  if (!currentUser || !users) return <div>Loading...</div>;

  const otherUsers = users.filter(
    (u) => u._id !== currentUser._id
  );

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
    <div className="w-64 h-screen border-r p-4 flex flex-col justify-between">

      {/* 🔹 Top Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Friends</h2>

        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border px-2 py-1 mb-3 rounded"
        />

        <div className="space-y-2">
          {filteredUsers.map((u) => {
            const conversation = conversations?.find((c) =>
              c.members.includes(u._id)
            );

            const unreadCount = conversation
              ? getUnreadCount(conversation._id)
              : 0;

            return (
              <div
                key={u._id}
                onClick={() => handleClick(u._id)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition"
              >
                <div className="relative">
                  <img
                    src={u.imageUrl}
                    className="w-8 h-8 rounded-full"
                  />

                  {Date.now() - u.lastSeen < 30000 && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                  )}
                </div>

                <span className="flex-1">{u.name}</span>

                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}

                {loadingId === u._id && (
                  <span className="text-xs text-gray-400">
                    Opening...
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 🔹 Bottom Profile Section */}
      <div className="border-t pt-4 mt-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={currentUser.imageUrl}
              className="w-10 h-10 rounded-full"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
          </div>

          <div className="flex-1">
            <p className="text-sm font-medium">
              {currentUser.name}
            </p>
            <p className="text-xs text-gray-500">
              Online
            </p>
          </div>

          <SignOutButton>
            <button className="text-xs text-red-500 hover:underline">
              Logout
            </button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}