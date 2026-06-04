"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Send, Bot, User, ArrowLeft } from "lucide-react";

interface Message {
  id: string;
  role: "bot" | "user";
  text: string;
  options?: { label: string; value: string }[];
  timestamp: Date;
}

const OPTIONS = [
  { label: "💵 Nạp tiền đúng nội dung nhưng chưa nhận được tiền", value: "correct_content" },
  { label: "📝 Chuyển khoản sai nội dung", value: "wrong_content" },
  { label: "💰 Chuyển khoản sai số tiền", value: "wrong_amount" },
  { label: "⚠️ Sai nội dung và sai số tiền", value: "wrong_both" },
  { label: "💸 Chuyển khoản dưới 10.000 VNĐ", value: "under_10k" },
  { label: "➕ Bổ sung thông tin khác", value: "other_info" },
];

function genId() {
  return "MH" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
}

export default function SupportPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <SupportContent />
    </Suspense>
  );
}

function SupportContent() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const searchParams = useSearchParams();
  const hotroParam = searchParams.get("hotro");

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [loading, setLoading] = useState(false);
  const [dbTicketId, setDbTicketId] = useState<string | null>(null);
  const chatEnd = useRef<HTMLDivElement>(null);
  const flowRef = useRef<{
    phase: string;
    selectedRef: string;
    issueType: string;
    ticketCreated: boolean;
    completed: boolean;
  }>({ phase: "idle", selectedRef: "", issueType: "", ticketCreated: false, completed: false });

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!user) return;

    const displayId = genId();
    setTicketId(displayId);

    if (hotroParam) {
      flowRef.current = { phase: "idle", selectedRef: hotroParam, issueType: "", ticketCreated: false, completed: false };
      const greeting: Message = {
        id: "g1", role: "bot",
        text: `👋 Xin chào ${user?.name || "bạn"}!\n\nTôi là <b>Mora Assistant</b> — Hệ thống hỗ trợ tự động 24/7.\n\n🎫 Mã phiên: <b>#${displayId}</b>\n📝 Mã giao dịch: <code>${hotroParam}</code>\n\nVui lòng chọn vấn đề:`,
        options: OPTIONS, timestamp: new Date(),
      };
      setMessages([greeting]);
      return;
    }

    // Load recent transactions
    fetch("/api/top-up").then(r => r.json()).then(d => {
      const txs = Array.isArray(d) ? d : d.transactions || [];
      const relevant = txs.filter((t: any) => t.status === "PENDING" || t.status === "FAILED").slice(0, 10);
      const txOpts = relevant.length > 0
        ? relevant.map((t: any) => ({
            label: `${t.status === "FAILED" ? "❌" : "⏳"} ${Number(t.amount).toLocaleString("vi-VN")}đ — ${t.reference}`,
            value: `tx:${t.reference}`
          }))
        : [];
      const greeting: Message = {
        id: "g1", role: "bot",
        text: `👋 Xin chào ${user?.name || "bạn"}!\n\nTôi là <b>Mora Assistant</b>. 🎫 Mã phiên: <b>#${displayId}</b>\n\n${relevant.length > 0 ? "Bạn có giao dịch cần hỗ trợ:" : "Vui lòng chọn vấn đề:"}`,
        options: relevant.length > 0 ? [...txOpts, { label: "📝 Nhập mã MORA thủ công", value: "enter_manual" }] : OPTIONS,
        timestamp: new Date(),
      };
      setMessages([greeting]);
    }).catch(() => {
      const greeting: Message = {
        id: "g1", role: "bot",
        text: `👋 Xin chào!\n\n🎫 Mã phiên: <b>#${displayId}</b>\n\nVui lòng chọn vấn đề:`,
        options: [{ label: "📝 Nhập mã MORA thủ công", value: "enter_manual" }],
        timestamp: new Date(),
      };
      setMessages([greeting]);
    });
  }, [user, hotroParam]);

  function addBot(text: string, opts?: { label: string; value: string }[]) {
    setMessages(prev => [...prev, { id: Date.now().toString(), role: "bot", text, options: opts, timestamp: new Date() }]);
  }

  function addUser(text: string) {
    setMessages(prev => [...prev, { id: Date.now().toString(), role: "user", text, timestamp: new Date() }]);
  }

  // Create ticket in DB
  async function createTicket(data: any) {
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.ticket) setDbTicketId(result.ticket.id);
      return result.ticket;
    } catch { return null; }
  }

  // Auto-credit
  async function autoCredit(ref: string, amount: number, info: any) {
    try {
      const res = await fetch("/api/support/auto-credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: ref, amount, ...info }),
      });
      return await res.json();
    } catch { return { success: false }; }
  }

  // DB check only
  async function checkDb(ref: string) {
    try {
      const res = await fetch("/api/support/check-deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: ref, dbOnly: true }),
      });
      return await res.json();
    } catch { return { found: false }; }
  }

  // Countdown + show ticket code
  function showSuccessFlow(amount: number, ref: string) {
    flowRef.current = { ...flowRef.current, completed: true };
    let count = 5;
    addBot(`✅ <b>Phiên hỗ trợ thành công!</b>\n\n💰 Số tiền: <b>${Number(amount).toLocaleString("vi-VN")}đ</b>\n📝 Mã CK: <code>${ref}</code>\n\n✅ Tiền đã được cộng vào tài khoản!\n\n🔐 Mã phiên của bạn: <b>#${ticketId}</b>\n📋 Lưu lại mã này để tra cứu.\n\nPhiên sẽ đóng trong ${count} giây...`);

    const timer = setInterval(() => {
      count--;
      if (count > 0) {
        setMessages(prev => {
          const updated = [...prev];
          const lastBot = updated[updated.length - 1];
          if (lastBot?.role === "bot") {
            lastBot.text = lastBot.text.replace(/Phiên sẽ đóng trong \d+ giây/, `Phiên sẽ đóng trong ${count} giây`);
          }
          return updated;
        });
      } else {
        clearInterval(timer);
        addBot(
          `🔒 <b>Phiên #${ticketId} đã đóng.</b>\n\n📌 Mã phiên: <code>#${ticketId}</code>\n💰 Số tiền: ${Number(amount).toLocaleString("vi-VN")}đ\n✅ Trạng thái: Thành công\n\nCảm ơn bạn đã sử dụng MoraHub! 🙏`,
          [{ label: "🔄 Phiên mới", value: "restart" }, { label: "👨‍💼 Liên hệ nhân viên", value: "contact_staff" }]
        );
      }
    }, 1000);
  }

  // Escalation flow
  function showEscalationFlow(ref: string, reason: string) {
    flowRef.current = { ...flowRef.current, completed: true };
    addBot(
      `👨‍💼 <b>Phiên đã được chuyển đến nhân viên hỗ trợ!</b>\n\n🎫 Mã phiên: <code>#${ticketId}</code>\n📝 Mã CK: <code>${ref}</code>\n📋 Lý do: ${reason}\n\n⏳ Nhân viên sẽ liên hệ với bạn trong thời gian sớm nhất.\n💡 Phiên sẽ ở trạng thái <b>PENDING</b> cho đến khi nhân viên xử lý.\n\n📌 Lưu lại mã phiên <b>#${ticketId}</b> để tra cứu.\n\nCảm ơn bạn đã liên hệ! 🙏`,
      [{ label: "🔄 Phiên mới", value: "restart" }]
    );
  }

  function showIssueMenu(ref: string) {
    flowRef.current = { ...flowRef.current, selectedRef: ref, issueType: "" };
    addBot(`Đã chọn giao dịch <code>${ref}</code>.\n\nVui lòng chọn vấn đề:`, OPTIONS);
  }

  function handleResult(result: any, ref: string) {
    if (result.found && result.status === "COMPLETED") {
      addBot(
        `✅ <b>Giao dịch đã được xử lý!</b>\n\n💰 Số tiền: <b>${Number(result.amount).toLocaleString("vi-VN")}đ</b>\n📝 Mã CK: <code>${ref}</code>\n\nVui lòng kiểm tra số dư. 🙏`,
        [{ label: "🔄 Vấn đề khác", value: "restart" }]
      );
    } else if (result.found && (result.status === "PENDING" || result.status === "FAILED")) {
      addBot(
        `⏳ Giao dịch <code>${ref}</code> (${result.status}).\n\n💰 Số tiền: <b>${Number(result.amount).toLocaleString("vi-VN")}đ</code>\n\nBạn đã chuyển khoản chưa? Nếu rồi, hãy gặp nhân viên để được hỗ trợ.`,
        [{ label: "👨‍💼 Gặp nhân viên", value: "contact_staff" }, { label: "🔄 Vấn đề khác", value: "restart" }]
      );
    } else {
      addBot(
        `❌ Không tìm thấy giao dịch <code>${ref}</code>.\n\nVui lòng kiểm tra lại mã CK.`,
        [{ label: "🔄 Thử lại", value: "restart" }]
      );
    }
  }

  async function handleOption(value: string) {
    if (value === "restart") {
      flowRef.current = { phase: "idle", selectedRef: "", issueType: "", ticketCreated: false, completed: false };
      setDbTicketId(null);
      fetch("/api/top-up").then(r => r.json()).then(d => {
        const txs = Array.isArray(d) ? d : d.transactions || [];
        const relevant = txs.filter((t: any) => t.status === "PENDING" || t.status === "FAILED").slice(0, 10);
        const txOpts = relevant.length > 0
          ? relevant.map((t: any) => ({
              label: `${t.status === "FAILED" ? "❌" : "⏳"} ${Number(t.amount).toLocaleString("vi-VN")}đ — ${t.reference}`,
              value: `tx:${t.reference}`
            }))
          : [];
        addBot("Bạn có giao dịch cần hỗ trợ:", relevant.length > 0 ? [...txOpts, { label: "📝 Nhập mã MORA", value: "enter_manual" }] : OPTIONS);
      }).catch(() => addBot("Vui lòng chọn vấn đề:", OPTIONS));
      return;
    }

    if (value === "enter_manual") {
      flowRef.current = { phase: "waiting_ref", selectedRef: "", issueType: "", ticketCreated: false, completed: false };
      addUser("Nhập mã MORA thủ công");
      addBot("📝 Vui lòng nhập mã MORA:\n\nVí dụ: <code>MORA7KX9B2NF</code>");
      return;
    }

    if (value === "back_menu") {
      flowRef.current = { ...flowRef.current, phase: "idle" };
      addBot("Vui lòng chọn vấn đề:", OPTIONS);
      return;
    }

    if (value === "contact_staff") {
      addUser("Liên hệ nhân viên");
      const ref = flowRef.current.selectedRef;
      await createTicket({
        reference: ref || null,
        issueType: "escalated",
        status: "ESCALATED",
      });
      showEscalationFlow(ref || "N/A", "User yêu cầu nhân viên hỗ trợ");
      return;
    }

    const ref = flowRef.current.selectedRef;

    if (value === "under_10k") {
      addUser("Chuyển khoản dưới 10K");
      addBot("❌ Giao dịch dưới 10.000 VNđ không được hỗ trợ.\n\nVui lòng nạp lại từ 10.000đ trở lên.");
      return;
    }

    if (value === "other_info") {
      flowRef.current = { ...flowRef.current, phase: "waiting_other_info" };
      addUser("Bổ sung thông tin");
      addBot("📸 Vui lòng nhập thông tin giao dịch để đối chiếu:\n\n⚠️ <b>Lưu ý:</b> Ảnh chuyển khoản chỉ dùng làm tài liệu tham khảo. Hệ thống chỉ xác nhận giao dịch dựa trên dữ liệu ngân hàng và bản ghi giao dịch thực tế.", [{ label: "Quay lại", value: "back_menu" }]);
      return;
    }

    if (!ref) {
      addBot("❌ Chưa chọn giao dịch.", [{ label: "🔄 Chọn lại", value: "restart" }]);
      return;
    }

    if (value === "correct_content") {
      addUser("Nạp tiền đúng ND nhưng chưa nhận tiền");
      flowRef.current = { ...flowRef.current, phase: "idle", issueType: "correct_content" };
      addBot("🔍 Đang kiểm tra...");
      const result = await checkDb(ref);
      handleResult(result, ref);
      return;
    }

    if (value === "wrong_content" || value === "wrong_amount" || value === "wrong_both") {
      flowRef.current = { ...flowRef.current, phase: "waiting_wrong_info", issueType: value };
      addUser(OPTIONS.find(o => o.value === value)?.label || value);

      const prompts: Record<string, string> = {
        wrong_content: "📝 Vui lòng nhập:\n\n1️⃣ Nội dung bạn đã chuyển\n2️⃣ Số tiền bạn đã chuyển\n3️⃣ Tên chủ tài khoản\n4️⃣ Số tài khoản\n\nVí dụ: <code>nap tien 51000 HUYNH THE NGOC 148393</code>",
        wrong_amount: "💰 Vui lòng nhập:\n\n1️⃣ Số tiền bạn đã chuyển\n2️⃣ Tên chủ tài khoản\n3️⃣ Số tài khoản\n\nVí dụ: <code>51000 HUYNH THE NGOC 148393</code>",
        wrong_both: "⚠️ Vui lòng nhập:\n\n1️⃣ Nội dung bạn đã chuyển\n2️⃣ Số tiền bạn đã chuyển\n3️⃣ Tên chủ tài khoản\n4️⃣ Số tài khoản\n\nVí dụ: <code>nap tien 51000 HUYNH THE NGOC 148393</code>",
      };
      addBot(prompts[value], [{ label: "Quay lại", value: "back_menu" }]);
      return;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    addUser(text);

    const flow = flowRef.current;

    if (flow.phase === "waiting_ref") {
      const ref = text.toUpperCase().trim();
      if (!ref.startsWith("MORA")) {
        addBot("❌ Mã không hợp lệ. Vui lòng nhập mã MORA...", [{ label: "Thử lại", value: "enter_manual" }]);
        return;
      }
      flowRef.current = { ...flow, phase: "idle", selectedRef: ref };
      showIssueMenu(ref);
      return;
    }

    if (flow.phase === "waiting_other_info") {
      flowRef.current = { ...flow, phase: "idle" };
      await createTicket({ issueType: "other", wrongInfo: text.slice(0, 500) });
      addBot(`ℹ️ Đã ghi nhận:\n\n${text.slice(0, 500)}\n\n🎫 Mã phiên: <code>#${ticketId}</code>\n\n⚠️ <b>Lưu ý:</b> Nếu bạn gửi ảnh chuyển khoản, ảnh chỉ dùng làm tài liệu tham khảo. Hệ thống chỉ xác nhận giao dịch dựa trên dữ liệu ngân hàng và bản ghi giao dịch thực tế.\n\nCảm ơn bạn.`, [{ label: "Vấn đề khác", value: "restart" }]);
      return;
    }

    if (flow.phase === "waiting_wrong_info") {
      const ref = flow.selectedRef;
      if (!ref) {
        addBot("❌ Lỗi: không tìm thấy mã giao dịch.", [{ label: "Bắt đầu lại", value: "restart" }]);
        return;
      }

      flowRef.current = { ...flow, phase: "idle" };
      addBot("🔍 Đang xử lý...");

      // Parse input
      const parts = text.trim().split(/\s+/);
      let inputAmt = 0;
      let amountIdx = -1;
      for (let i = 0; i < parts.length; i++) {
        if (/^\d+$/.test(parts[i]) && parseInt(parts[i]) >= 1000) {
          inputAmt = parseInt(parts[i]);
          amountIdx = i;
          break;
        }
      }
      const wrongContent = amountIdx > 0 ? parts.slice(0, amountIdx).join(" ") : "";
      const afterAmount = amountIdx >= 0 ? parts.slice(amountIdx + 1) : [];
      let accountName = "";
      let accountNumber = "";
      if (afterAmount.length >= 2) {
        accountNumber = afterAmount[afterAmount.length - 1];
        accountName = afterAmount.slice(0, afterAmount.length - 1).join(" ");
      } else if (afterAmount.length === 1) {
        if (/^\d{6,}$/.test(afterAmount[0])) accountNumber = afterAmount[0];
        else accountName = afterAmount[0];
      }

      // Step 1: Check DB
      const dbResult = await checkDb(ref);

      if (dbResult.found && dbResult.status === "COMPLETED") {
        addBot(
          `✅ <b>Giao dịch đã được xử lý!</b>\n\n💰 Số tiền: <b>${Number(dbResult.amount).toLocaleString("vi-VN")}đ</b>\n\nVui lòng kiểm tra số dư.`,
          [{ label: "🔄 Vấn đề khác", value: "restart" }]
        );
        return;
      }

      if (dbResult.found && (dbResult.status === "PENDING" || dbResult.status === "FAILED")) {
        // Step 2: Auto-credit
        addBot("📋 Đang tự xử lý...");

        const creditResult = await autoCredit(ref, dbResult.amount || inputAmt, {
          wrongContent: wrongContent || undefined,
          wrongAmount: inputAmt || undefined,
          accountName: accountName || undefined,
          accountNumber: accountNumber || undefined,
        });

        // Create ticket
        await createTicket({
          reference: ref,
          issueType: flow.issueType || "wrong_content",
          amount: dbResult.amount || inputAmt,
          wrongContent: wrongContent || undefined,
          wrongAmount: inputAmt || undefined,
          accountName: accountName || undefined,
          accountNumber: accountNumber || undefined,
        });

        if (creditResult.success) {
          showSuccessFlow(dbResult.amount || inputAmt, ref);
        } else {
          showEscalationFlow(ref, "Auto-credit thất bại, cần nhân viên xử lý");
        }
        return;
      }

      // Not found in DB — escalate to staff
      await createTicket({
        reference: ref,
        issueType: flow.issueType || "wrong_content",
        amount: inputAmt || undefined,
        wrongContent: wrongContent || undefined,
        accountName: accountName || undefined,
        accountNumber: accountNumber || undefined,
      });
      showEscalationFlow(ref, `Không tìm thấy giao dịch ${ref} trong hệ thống`);
      return;
    }

    addBot("Vui lòng chọn vấn đề:", OPTIONS);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-4 flex items-center gap-3">
        <a href="/dashboard" className="text-slate-400 hover:text-slate-600"><ArrowLeft className="w-5 h-5" /></a>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-slate-900">💵 Hỗ Trợ Nạp Tiền</h1>
          <p className="text-xs text-slate-400">Mora Assistant • #{ticketId} • Tự động 24/7</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="h-[550px] overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "bot" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={`max-w-[80%] ${msg.role === "user" ? "order-first" : ""}`}>
                <div className={`p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${msg.role === "user" ? "bg-indigo-500 text-white rounded-tr-sm" : "bg-slate-100 text-slate-800 rounded-tl-sm"}`} dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, "<br>") }} />
                {msg.options && msg.role === "bot" && (
                  <div className="mt-2 space-y-1">
                    {msg.options.map((opt) => (
                      <button key={opt.value} onClick={() => handleOption(opt.value)} className="block w-full text-left px-4 py-2.5 bg-white border border-indigo-200 text-indigo-700 rounded-xl text-sm font-medium hover:bg-indigo-50 transition-colors">
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
                <div className={`text-[10px] text-slate-400 mt-1 ${msg.role === "user" ? "text-right" : ""}`}>
                  {msg.timestamp.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEnd} />
        </div>

        <form onSubmit={handleSubmit} className="border-t border-slate-100 p-4 flex gap-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
            placeholder={flowRef.current.phase !== "idle" ? "Nhập thông tin..." : "Nhập tin nhắn..."}
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            disabled={loading || flowRef.current.completed} />
          <Button type="submit" disabled={loading || !input.trim() || flowRef.current.completed} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl px-4">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>

      <p className="text-center text-xs text-slate-400 mt-3">Mora Assistant • #{ticketId} • Phiên hỗ trợ tự động</p>
    </div>
  );
}
