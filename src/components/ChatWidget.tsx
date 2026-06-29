"use client";

import { MessageCircle, Send, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatConfig } from "@/lib/chat-config";
import { getChatSessionId, sendChatMessage, type ChatContext } from "@/lib/n8n-chat";

interface ChatMessage {
  id: string;
  role: "bot" | "user";
  text: string;
}

export function ChatWidget({
  config,
  context,
}: {
  config: ChatConfig;
  context?: ChatContext;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef("");

  useEffect(() => {
    sessionId.current = getChatSessionId();
  }, []);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ id: "welcome", role: "bot", text: config.initialMessage }]);
    }
  }, [open, messages.length, config.initialMessage]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const reply = await sendChatMessage(text, sessionId.current, {
        brand: context?.brand || "MAVASH Events",
        source: context?.source,
        eventSlug: context?.eventSlug,
        eventName: context?.eventName,
      });
      setMessages((prev) => [
        ...prev,
        { id: `bot-${Date.now()}`, role: "bot", text: reply || "..." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "bot",
          text: "מצטערים, תקלה זמנית. נסו שוב או כתבו לנו בוואטסאפ 💬",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, context]);

  if (!config.enabled) return null;

  return (
    <>
      {open && (
        <div
          className="fixed bottom-28 start-4 z-50 flex h-[min(520px,calc(100vh-8rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-gold/20 bg-cream shadow-2xl sm:start-6"
          dir="rtl"
        >
          <div className="flex items-center gap-3 border-b border-charcoal/5 bg-white px-5 py-4">
            {config.avatarUrl && (
              <Image
                src={config.avatarUrl}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-gold/30"
              />
            )}
            <div className="flex-1">
              <p className="font-heading text-lg text-charcoal">{config.title}</p>
              <p className="text-xs text-charcoal/50">{config.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-2 text-charcoal/50 hover:bg-charcoal/5"
              aria-label="סגור צ'אט"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "rounded-br-sm bg-gold text-charcoal"
                      : "rounded-bl-sm border border-charcoal/5 bg-white text-charcoal/85"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-end">
                <div className="rounded-2xl rounded-bl-sm border border-charcoal/5 bg-white px-4 py-3">
                  <span className="inline-flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gold" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gold [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gold [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-charcoal/5 bg-white p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={config.placeholder}
                disabled={loading}
                className="flex-1 rounded-full border border-charcoal/10 bg-cream px-4 py-3 text-sm outline-none focus:border-gold disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold text-charcoal disabled:opacity-40"
                aria-label="שלח"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="fixed bottom-28 start-4 z-50 flex h-14 items-center gap-2 rounded-full bg-charcoal px-5 text-cream shadow-lg transition hover:bg-charcoal/90 sm:start-6"
        aria-label={config.launcherLabel}
        aria-expanded={open}
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <>
            <MessageCircle className="h-5 w-5" />
            <span className="hidden text-sm sm:inline">{config.launcherLabel}</span>
          </>
        )}
      </button>
    </>
  );
}
