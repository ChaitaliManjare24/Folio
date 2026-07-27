"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Message { role: "user" | "assistant"; content: string }

interface Config { enabled: boolean; suggestions: string[]; rateLimit: number }

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<Config | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/chat/config").then((r) => r.json()).then((c: Config) => {
      if (c.enabled) setConfig(c);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");
    setError(null);
    const newMessages = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setMessages([...newMessages, { role: "assistant", content: data.content }]);
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }, [messages, loading]);

  if (!config) return null;

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open chat"
          style={{
            position: "fixed", bottom: 20, right: 20, zIndex: 9999,
            width: 56, height: 56, borderRadius: "50%", border: "none", cursor: "pointer",
            background: "#131210", color: "#f5f3ec", fontSize: 24, display: "flex",
            alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(19,18,16,.25)",
            transition: "transform .3s",
          }}
        >
          💬
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          style={{
            position: "fixed", bottom: 0, right: 0, zIndex: 9999,
            width: "100%", maxWidth: 400, height: "100%", maxHeight: 600,
            background: "#f5f3ec", border: "1px solid rgba(19,18,16,.14)",
            borderRadius: "12px 12px 0 0", display: "flex", flexDirection: "column",
            boxShadow: "0 -4px 40px rgba(19,18,16,.12)",
          }}
        >
          {/* Header */}
          <div
            onClick={() => setOpen(false)}
            style={{
              padding: "14px 18px", background: "#131210", color: "#f5f3ec",
              borderRadius: "12px 12px 0 0", cursor: "pointer", display: "flex",
              justifyContent: "space-between", alignItems: "center",
              fontFamily: '"JetBrains Mono", monospace', fontSize: 13, fontWeight: 600,
            }}
          >
            <span>💬 Ask anything</span>
            <span style={{ fontSize: 18, lineHeight: 1 }}>✕</span>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", paddingTop: 20 }}>
                <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: "#6f6c63", marginBottom: 16 }}>
                  Ask me about blog posts, projects, or anything on this site.
                </p>
                {config.suggestions.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                    {config.suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => send(s)}
                        style={{
                          padding: "8px 16px", border: "1px solid rgba(19,18,16,.14)", borderRadius: 100,
                          background: "rgba(49,40,255,.06)", color: "#3128ff", cursor: "pointer",
                          fontFamily: '"JetBrains Mono", monospace', fontSize: 12, fontWeight: 500,
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%", padding: "10px 14px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  background: m.role === "user" ? "#3128ff" : "#efebdf",
                  color: m.role === "user" ? "#fff" : "#131210",
                  fontFamily: '"Archivo", system-ui, sans-serif', fontSize: 14, lineHeight: 1.5,
                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                }}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: "flex-start", padding: "10px 14px", background: "#efebdf", borderRadius: "14px 14px 14px 4px", fontFamily: '"JetBrains Mono", monospace', fontSize: 13, color: "#6f6c63" }}>
                <span className="chat-dots">●●●</span>
              </div>
            )}
            {error && (
              <div style={{ alignSelf: "center", fontSize: 12, color: "#c1262a", fontFamily: '"JetBrains Mono", monospace' }}>{error}</div>
            )}
          </div>

          {/* Input */}
          <div style={{ padding: 12, borderTop: "1px solid rgba(19,18,16,.07)", display: "flex", gap: 8 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="Ask a question..."
              disabled={loading}
              style={{
                flex: 1, padding: "10px 14px", border: "1px solid rgba(19,18,16,.14)", borderRadius: 8,
                background: "#efebdf", color: "#131210", fontSize: 14, outline: "none",
                fontFamily: '"Archivo", system-ui, sans-serif',
              }}
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              style={{
                padding: "10px 16px", border: "none", borderRadius: 8, background: "#3128ff", color: "#fff",
                cursor: "pointer", fontWeight: 600, fontSize: 14, fontFamily: '"Archivo", system-ui, sans-serif',
                opacity: loading || !input.trim() ? 0.5 : 1,
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chat-bounce { 0%,100%{opacity:.3} 50%{opacity:1} }
        .chat-dots span { animation: chat-bounce 1.4s infinite; display: inline-block; }
        .chat-dots span:nth-child(1){animation-delay:0s}
        .chat-dots span:nth-child(2){animation-delay:.2s}
        .chat-dots span:nth-child(3){animation-delay:.4s}
        @media (min-width: 681px) {
          .chat-panel { bottom: 20px !important; right: 20px !important; border-radius: 12px !important; height: 600px !important; }
        }
      `}</style>
    </>
  );
}
