# 🤖 MoraHub Telegram Bot — Hướng dẫn cài đặt & sử dụng

**Ngày tạo:** 2026-06-03  
**Bot:** @MoraManager_bot  
**Token:** `8616832682:AAF8...Qy8M` (lấy full trong `.env`)

---

## 📋 Tính năng

| Feature | Mô tả |
|---------|--------|
| `/start` | Tin nhắn chào mừng |
| `/verify MÃ` | Liên kết Telegram với website, thưởng **50,000đ credit** |
| `/balance` | Xem số dư & plan hiện tại |
| `/models` | Danh sách AI models có sẵn |
| `/keys` | Quản lý API keys |
| `/usage` | Thống kê sử dụng 24h & 7 ngày |
| `/help` | Hướng dẫn sử dụng |

---

## 🗂 Files đã thay đổi

```
/var/www/morahub.online/backup-telegram-20260603/
├── .env                    # Bot token config
├── next.config.ts          # Thêm eslint/typescript ignore
├── schema.prisma           # Thêm telegramId, telegramVerified, telegramVerifyCode
├── telegram-bot.ts         # Thêm /verify command + update help
├── route.ts                # API /api/telegram/verify (tạo mã + xác minh + unlink)
└── page.tsx                # Settings UI — section "Liên kết Telegram"
```

### Files gốc (trong project)

```
/var/www/morahub.online/project/
├── .env                                          # ← TELEGRAM_BOT_TOKEN
├── prisma/schema.prisma                          # ← User model thêm 3 field
├── src/lib/telegram-bot.ts                       # ← Bot commands + /verify logic
├── src/app/api/telegram/verify/route.ts          # ← NEW: verify API
├── src/app/api/telegram/webhook/route.ts         # ← Webhook endpoint (có sẵn)
├── src/app/dashboard/settings/page.tsx           # ← Thêm Telegram section UI
└── next.config.ts                                # ← Thêm eslint ignore
```

---

## 🔄 Flow liên kết Telegram

1. User vào **morahub.online/dashboard/settings**
2. Nhấn **"Lấy mã xác minh"** → API tạo mã 6 chữ, hết hạn 10 phút
3. User mở Telegram → tìm **@MoraManager_bot** → `/start`
4. User gửi `/verify MÃ` cho bot
5. Bot tìm user có mã khớp → link `telegramId` → cộng **50,000đ credit**
6. Ghi transaction `SYSTEM / COMPLETED`

---

## 🛠 Cài đặt lại từ đầu (nếu cần)

### 1. Setup Bot Token
```bash
# Tạo bot qua @BotFather trên Telegram
# Lấy token, thêm vào .env:
echo "TELEGRAM_BOT_TOKEN=YOUR_TOKEN_HERE" >> /var/www/morahub.online/project/.env
```

### 2. Push Schema
```bash
cd /var/www/morahub.online/project
npx prisma db push --accept-data-loss
```

### 3. Build & Deploy
```bash
# ⚠️ Cần ≥ 8GB RAM hoặc 2GB swap
cd /var/www/morahub.online/project
rm -rf .next
NODE_OPTIONS="--max-old-space-size=512" npx next build
systemctl restart morahub-nextjs
```

### 4. Set Webhook
```bash
curl -s "https://api.telegram.org/botYOUR_TOKEN/setWebhook?url=https://morahub.online/api/telegram/webhook"
```

---

## ⚠️ Vấn đề đã gặp & cách xử lý

| Vấn đề | Nguyên nhân | Giải pháp |
|--------|-------------|-----------|
| Build OOM killed | Next.js 16 Turbopack cần > 6GB RAM | Tạo swap 2GB: `fallocate -l 2G /swapfile && chmod 600 /swapfile && /sbin/mkswap /swapfile && /sbin/swapon /swapfile` |
| Build syntax error | `</n` thay vì `</li>` trong JSX | Fix lại tag HTML đúng |
| Bot webhook redirect | Endpoint yêu cầu auth | Set webhook trực tiếp qua Telegram API |

### Tạo Swap (nếu chưa có)
```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
/sbin/mkswap /swapfile
/sbin/swapon /swapfile
# Verify:
free -m
```

---

## 🧪 Test

```bash
# Test bot online
curl -s "https://api.telegram.org/bot861683…Qy8M/getMe"

# Test webhook info
curl -s "https://api.telegram.org/bot861683…Qy8M/getWebhookInfo"

# Test send message
curl -s "https://api.telegram.org/bot861683…Qy8M/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id": 7634595161, "text": "Test!"}'

# Test service
systemctl status morahub-nextjs
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

---

## 📝 DB Schema mới (User model)

```prisma
model User {
  // ... fields có sẵn ...
  telegramId         String?   @unique
  telegramVerified   Boolean   @default(false)
  telegramVerifyCode String?
  telegramVerifyExpiry DateTime?
}
```

---

## 👤 Admin

- **Admin account:** admin@morahub.com (role: ADMIN)
- **Admin Telegram ID:** 7634595161

---

*Backup created by Mimo 💌 — 2026-06-03*
