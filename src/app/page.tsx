"use client";

import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import SyncUser from "../components/SyncUser";

export default function Home() {
  const { user } = useUser();
  // Strongly typed the state instead of 'any'
  const [activeConversation, setActiveConversation] = useState<string | null>(null);

  const currentUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  return (
    // Changed to h-[100dvh] to perfectly fit mobile screens (ignores browser URL bars)
    <div className="h-[100dvh] w-full bg-[#0b0f19] overflow-hidden text-gray-100 flex">
      
      {/* ================= SIGNED OUT (LANDING PAGE) ================= */}
      <SignedOut>
        <div className="relative h-full w-full flex items-center justify-center px-4 sm:px-6">
          {/* Animated Background Gradients */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-cyan-500/10 blur-3xl opacity-60 animate-pulse" />
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[400px] max-h-[400px] bg-indigo-500/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] max-w-[400px] max-h-[400px] bg-cyan-500/10 rounded-full blur-[120px]" />

          <div className="w-full max-w-md relative z-10">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 text-white flex items-center justify-center text-3xl font-bold shadow-lg shadow-indigo-500/20">
                T
              </div>
            </div>

            {/* Glass Card */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl p-8 sm:p-10 text-center transition-all">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
                Welcome to TarsChat
              </h1>
              <p className="text-gray-400 text-sm sm:text-base mb-8">
                Seamless, real-time conversations powered by a modern stack.
              </p>

              <SignInButton mode="modal">
                <button className="w-full bg-white text-gray-900 py-3.5 px-4 rounded-xl font-semibold hover:bg-gray-100 hover:scale-[1.02] active:scale-95 shadow-xl transition-all duration-200 flex items-center justify-center gap-3">
                  {/* Google SVG Icon */}
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>
              </SignInButton>

              <p className="text-xs text-gray-500 mt-6 font-medium">
                Secure authentication powered by Clerk
              </p>
            </div>
          </div>
        </div>
      </SignedOut>

      {/* ================= SIGNED IN (CHAT APP) ================= */}
      <SignedIn>
        <SyncUser />
        {currentUser ? (
          <div className="flex h-full w-full">
            
            {/* --- SIDEBAR --- */}
            {/* Mobile: Full width if NO chat selected. Hidden if chat IS selected. */}
            {/* Desktop: Always visible, fixed width. */}
            <div
              className={`h-full border-r border-white/10 bg-[#0b0f19] flex-shrink-0 transition-all duration-300
                ${activeConversation ? "hidden md:flex md:w-[320px] lg:w-[380px]" : "flex w-full md:w-[320px] lg:w-[380px]"}
              `}
            >
              <Sidebar onSelectConversation={setActiveConversation} />
            </div>

            {/* --- MAIN CHAT AREA --- */}
            {/* Mobile: Hidden if NO chat selected. Full width if chat IS selected. */}
            {/* Desktop: Always visible, flex-1 to fill space. */}
            <div
              className={`h-full flex-1 bg-[#0f1523] flex-col relative
                ${!activeConversation ? "hidden md:flex" : "flex w-full"}
              `}
            >
              {/* Mobile Back Button - Crucial for UX so users aren't stuck on a chat on their phone */}
              {activeConversation && (
                <div className="md:hidden p-3 border-b border-white/10 bg-[#0b0f19]/90 backdrop-blur-md sticky top-0 z-10">
                  <button
                    onClick={() => setActiveConversation(null)}
                    className="text-gray-400 hover:text-white flex items-center gap-1 text-sm font-medium transition-colors"
                  >
                    ← Back to chats
                  </button>
                </div>
              )}

              {activeConversation ? (
                <ChatWindow
                  conversationId={activeConversation}
                  currentUserId={currentUser._id}
                />
              ) : (
                /* Polished Empty State for Desktop */
                <div className="flex-1 flex flex-col items-center justify-center bg-[#0b0f19]">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10 shadow-2xl">
                    <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2">TarsChat for Web</h3>
                  <p className="text-gray-400 max-w-sm text-center text-sm leading-relaxed">
                    Select a conversation from the sidebar to start messaging, or start a new chat.
                  </p>
                </div>
              )}
            </div>

          </div>
        ) : (
          /* Elegant Loading Spinner while fetching Convex user */
          <div className="h-full w-full flex items-center justify-center bg-[#0b0f19]">
            <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        )}
      </SignedIn>
      
    </div>
  );
}