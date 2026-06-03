"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Copy, Check, Loader2, Key, Trash2, Plus, Send, Square, RotateCcw, MessageSquare, Clock } from "lucide-react";
import { toast } from "sonner";

interface ApiKey { id: string; name: string; key: string; isActive: boolean }
interface ChatMessage { role: "system" | "user" | "assistant"; content: string }
interface ChatSession { id: string; title: string; model: string | null; createdAt: string; updatedAt: string; messages: any[] }

export default function PlaygroundPage() {
  const [model, setModel] = useState("deepseek-3.2");
  const [maxTokens, setMaxTokens] = useState("2048");
  const [temperature, setTemperature] = useState("0.7");
  const [systemPrompt, setSystemPrompt] = useState("Bạn là trợ lý AI thông minh, trả lời bằng tiếng Việt.");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [copied, setCopied] = useState(false);
  const [models, setModels] = useState<any[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // History
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetch("/api/keys").then(r => r.json()).then(d => setKeys(d.keys || [])).catch(() => {});
    fetch("/api/models").then(r => r.json()).then(d => setModels(Array.isArray(d) ? d : d.models || [])).catch(() => {});
    fetchSessions();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function fetchSessions() {
    fetch("/api/playground/sessions").then(r => r.json()).then(d => setSessions(Array.isArray(d) ? d : [])).catch(() => {});
  }

  async function loadSession(sessionId: string) {
    try {
      const res = await fetch(`/api/playground/sessions/${sessionId}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages.map((m: any) => ({ role: m.role, content: m.content })));
        setCurrentSessionId(sessionId);
        if (data.model) setModel(data.model);
        setShowHistory(false);
      }
    } catch { toast.error("Lỗi load session"); }
  }

  async function deleteSession(sessionId: string) {
    await fetch(`/api/playground/sessions/${sessionId}`, { method: "DELETE" });
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) { setCurrentSessionId(null); setMessages([]); }
    toast.success("Đã xóa");
  }

  async function saveSession() {
    if (messages.length === 0) { toast.error("Chưa có tin nhắn"); return; }
    try {
      const title = messages.find(m => m.role === "user")?.content?.slice(0, 50) || "New Chat";
      const res = await fetch("/api/playground/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, model }),
      });
      const session = await res.json();
      // Save all messages
      for (const msg of messages) {
        await fetch(`/api/playground/sessions/${session.id}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: msg.role, content: msg.content }),
        });
      }
      setCurrentSessionId(session.id);
      fetchSessions();
      toast.success("Đã lưu chat!");
    } catch { toast.error("Lỗi lưu"); }
  }

  function newChat() {
    setMessages([]);
    setCurrentSessionId(null);
    setError("");
  }

  async function sendMessage() {
    if (!apiKey) { toast.error("Chọn API Key!"); return; }
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    addMessage("user", userMsg);
    setLoading(true);
    setStreaming(true);
    setError("");

    const allMessages: ChatMessage[] = [];
    if (systemPrompt.trim()) allMessages.push({ role: "system", content: systemPrompt });
    allMessages.push(...messages, { role: "user", content: userMsg });

    setMessages(prev => [...prev, { role: "assistant", content: "" }]);

    try {
      abortRef.current = new AbortController();
      const res = await fetch("/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages: allMessages, max_tokens: parseInt(maxTokens), temperature: parseFloat(temperature), stream: true }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || `HTTP ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === "assistant") {
                  updated[updated.length - 1] = { ...last, content: last.content + delta };
                }
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        setError(e.message);
        setMessages(prev => prev.slice(0, -1));
      }
    } finally {
      setLoading(false);
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function addMessage(role: "system" | "user" | "assistant", content: string) {
    setMessages(prev => [...prev, { role, content }]);
  }

  function stopGeneration() { abortRef.current?.abort(); setLoading(false); setStreaming(false); }
  function clearChat() { setMessages([]); setError(""); setCurrentSessionId(null); }
  function copyLastMessage() {
    const last = messages.filter(m => m.role === "assistant").pop();
    if (last) { navigator.clipboard.writeText(last.content); setCopied(true); toast.success("Đã copy!"); setTimeout(() => setCopied(false), 2000); }
  }

  const activeModels = models.filter(m => m.isActive);

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-start lg:items-center justify-between flex-col lg:flex-row gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">API Playground</h1>
          <p className="text-slate-500 mt-1 text-sm">Chat với AI models — streaming, lưu lịch sử</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)} className="rounded-xl">
            <Clock className="w-4 h-4 mr-1" /> Lịch Sử ({sessions.length})
          </Button>
          {messages.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={saveSession} className="rounded-xl">
                {currentSessionId ? "Cập Nhật" : "Lưu Chat"}
              </Button>
              <Button variant="outline" size="sm" onClick={clearChat} className="text-slate-500 border-slate-200 rounded-xl">
                <RotateCcw className="w-4 h-4 mr-1" /> Mới
              </Button>
            </>
          )}
        </div>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 max-h-64 overflow-y-auto">
          <h3 className="font-bold text-slate-900 text-sm mb-3">Lịch Sử Chat</h3>
          {sessions.length === 0 ? (
            <p className="text-xs text-slate-400">Chưa có session nào</p>
          ) : (
            <div className="space-y-2">
              {sessions.map(s => (
                <div key={s.id} className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${currentSessionId === s.id ? "bg-indigo-50 border border-indigo-200" : "hover:bg-slate-50"}`}
                  onClick={() => loadSession(s.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-700 truncate">{s.title}</div>
                    <div className="text-[10px] text-slate-400">{s.model} · {new Date(s.updatedAt).toLocaleString("vi-VN")}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }} className="text-slate-400 hover:text-red-500 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-4">
        {/* Settings Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Cấu Hình</h3>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">API Key</label>
              <select value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900">
                <option value="">Chọn API Key...</option>
                {keys.filter(k => k.isActive).map(k => (
                  <option key={k.id} value={k.key}>{k.name} ({k.key.slice(0, 12)}...)</option>
                ))}
              </select>
              {keys.length === 0 && <p className="text-xs text-amber-600 mt-1">Chưa có API key. <a href="/dashboard/keys" className="underline">Tạo ngay</a></p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Model</label>
              <select value={model} onChange={(e) => setModel(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900">
                {activeModels.map(m => (
                  <option key={m.name} value={m.name}>{m.displayName} ({m.provider})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">System Prompt</label>
              <textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={3} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Max Tokens</label>
                <input type="number" value={maxTokens} onChange={(e) => setMaxTokens(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Temperature</label>
                <input type="number" step="0.1" min="0" max="2" value={temperature} onChange={(e) => setTemperature(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900" />
              </div>
            </div>
          </div>
          <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-4">
            <h4 className="text-xs font-bold text-indigo-700 mb-2">💡 Hướng dẫn</h4>
            <ul className="text-xs text-indigo-600 space-y-1">
              <li>• Nhập tin nhắn và nhấn Enter</li>
              <li>• Streaming hiển thị từng token</li>
              <li>• Nhấn ⏹ để dừng giữa chừng</li>
              <li>• Nhấn "Lưu Chat" để lưu lịch sử</li>
              <li>• Xem lại chat cũ tại "Lịch Sử"</li>
            </ul>
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 flex flex-col h-[calc(100vh-12rem)]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && !loading && (
              <div className="text-center py-16 text-slate-400">
                <Key className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Nhập tin nhắn để bắt đầu chat</p>
                <p className="text-xs mt-1">Hỗ trợ streaming real-time</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white" : "bg-slate-100 text-slate-800"}`}>
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[8px] text-white font-bold">AI</div>
                      <span className="text-[10px] font-semibold text-slate-500">Assistant</span>
                      {loading && i === messages.length - 1 && <span className="text-[10px] text-indigo-500 animate-pulse">●</span>}
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-wrap">{msg.content || (loading && i === messages.length - 1 ? "..." : "")}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t border-slate-100 p-4">
            {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3 text-sm text-red-700">{error}</div>}
            <div className="flex gap-2">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (streaming ? stopGeneration() : sendMessage())}
                placeholder={apiKey ? "Nhập tin nhắn..." : "Chọn API Key trước"} disabled={!apiKey}
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-50" />
              {streaming ? (
                <Button onClick={stopGeneration} className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-4"><Square className="w-4 h-4" /></Button>
              ) : (
                <Button onClick={sendMessage} disabled={loading || !apiKey || !input.trim()} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl px-4"><Send className="w-4 h-4" /></Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
