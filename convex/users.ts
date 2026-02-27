import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create user if not exists
 */
export const createUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) =>
        q.eq("clerkId", args.clerkId)
      )
      .unique();

    if (existing) {
      return existing._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      imageUrl: args.imageUrl,
      lastSeen: Date.now(),
    });

    return userId;
  },
});

/**
 * Get all users
 */
export const getUsers = query({
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

/**
 * Get single user by Clerk ID
 */
export const getUserByClerkId = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) =>
        q.eq("clerkId", args.clerkId)
      )
      .unique();
  },
});

/**
 * Safe update lastSeen
 */
export const updateLastSeen = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    // 🔒 Prevent crash if user doesn't exist
    if (!user) {
      console.log(
        "updateLastSeen skipped: user not found",
        args.userId
      );
      return;
    }

    await ctx.db.patch(args.userId, {
      lastSeen: Date.now(),
    });
  },
});