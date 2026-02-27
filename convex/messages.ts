import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      content: args.content,
      createdAt: Date.now(),
      isDeleted: false,
    });
  },
});

export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();
  },
});
export const getAllMessages = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("messages").collect();
  },
});
export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);

    if (!message) return;

    // Only allow deleting own messages
    if (message.senderId !== args.userId) return;

    await ctx.db.patch(args.messageId, {
      isDeleted: true,
    });
  },
});
export const toggleReaction = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return;

    // Safely cast reactions
    const reactions = (message.reactions ?? {}) as Record<
      string,
      string[]
    >;

    const usersForEmoji = reactions[args.emoji] ?? [];

    const hasReacted = usersForEmoji.includes(args.userId);

    let updatedUsers: string[];

    if (hasReacted) {
      updatedUsers = usersForEmoji.filter(
        (id) => id !== args.userId
      );
    } else {
      updatedUsers = [...usersForEmoji, args.userId];
    }

    const updatedReactions: Record<string, string[]> = {
      ...reactions,
      [args.emoji]: updatedUsers,
    };

    
  },
});