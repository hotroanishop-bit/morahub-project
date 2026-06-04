# MoraHub - AI API Platform

Nền tảng API AI hàngh đầu Việt Nam với hệ thống nạp tiền tự động qua MB Bank.

## Tính năng

- 🔑 **API Key Management** - Quản lý API keys cho nhiều AI models
- 💳 **Auto Deposit** - Nạp tiền tự động qua MB Bank
- 📱 **Telegram Bot** - Hỗ trợ khách hàng qua Telegram
- 🎫 **Support Ticket** - Hệ thống hỗ trợ khách hàng chuyên nghiệp
- 📊 **Analytics** - Thống kê sử dụng và doanh thu
- 🔒 **Bảo mật** - Anti-fraud, duplicate protection, rate limiting

## Cài đặt

```bash
# Clone repo
git clone https://github.com/your-username/morahub.git
cd morahub

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Chỉnh sửa .env với thông tin của bạn

# Setup database
npx prisma db push
npx prisma db seed

# Build và chạy
npm run build
npm start
```

## Environment Variables

Xem file `.env.example` để biết các biến môi trường cần thiết.

## Tech Stack

- **Frontend:** Next.js 16, React, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** MySQL 8.0
- **Auth:** NextAuth v5
- **Payment:** MB Bank Auto-Deposit
- **Bot:** Telegram Bot API

## License

MIT
