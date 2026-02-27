import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get or create a one-on-one conversation between two users
 */
export const getOrCreateConversation = mutation({
  args: {
    user1: v.id("users"),
    user2: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Fetch all conversations
    const conversations = await ctx.db
      .query("conversations")
      .collect();

    // Find conversation containing both users
    const existing = conversations.find((conv) => {
      return (
        conv.members.length === 2 &&
        conv.members.includes(args.user1) &&
        conv.members.includes(args.user2)
      );
    });

    if (existing) {
      return existing._id;
    }

    // Create new conversation
    const newConversationId = await ctx.db.insert("conversations", {
      members: [args.user1, args.user2],
      createdAt: Date.now(),
    });

    return newConversationId;
  },
});

/**
 * Get conversations for a specific user
 */
export const getUserConversations = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const conversations = await ctx.db
      .query("conversations")
      .collect();

    return conversations.filter((conv) =>
      conv.members.includes(args.userId)
    );
  },
});
export const markConversationAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);

    if (!conversation) return;

    const existingLastOpened = conversation.lastOpened || {};

    await ctx.db.patch(args.conversationId, {
      lastOpened: {
        ...existingLastOpened,
        [args.userId]: Date.now(),
      },
    });
  },
});