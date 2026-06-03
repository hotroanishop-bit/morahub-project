# 🚀 MoraHub — Hướng dẫn cài đặt

## Yêu cầu
- Node.js 18+
- MySQL 8.0
- VPS 6GB RAM trở lên (hoặc 2GB swap)

## Cài đặt nhanh

```bash
# 1. Clone repo
git clone https://github.com/hotroanishop-bit/morahub-project.git
cd morahub-project

# 2. Cài dependencies
npm install

# 3. Setup database
cp .env.example .env
# Chỉnh .env với thông tin MySQL của bạn
npx prisma db push
npx prisma db seed

# 4. Build & start
npm run build
npm start
```

## Cài đặt trên VPS

```bash
# Systemd service
cat > /etc/systemd/system/morahub-nextjs.service << 'EOF'
[Unit]
Description=MoraHub Next.js App
After=network.target mysql.service
Wants=mysql.service

[Service]
Type=simple
WorkingDirectory=/var/www/morahub.online/project
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable morahub-nextjs
systemctl start morahub-nextjs
```

## Cloudflare Tunnel

```bash
# Install cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared

# Login & create tunnel
cloudflared tunnel login
cloudflared tunnel create morahub
cloudflared tunnel route dns morahub morahub.online
cloudflared tunnel run morahub
```

## Swap (nếu VPS < 8GB RAM)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
/sbin/mkswap /swapfile
/sbin/swapon /swapfile
# Verify:
free -m
```

## Telegram Bot Setup

```bash
# 1. Tạo bot qua @BotFather trên Telegram
# 2. Thêm token vào .env:
# TELEGRAM_BOT_TOKEN=your_token_here

# 3. Set webhook:
curl "https://api.telegram.org/botYOUR_TOKEN/setWebhook?url=https://your-domain.com/api/telegram/webhook"
```

## Admin Default
- Email: admin@morahub.com
- Password: admin123

## Test Account
- Email: user@morahub.com
- Password: user123

---

*Built by Mimo 💌*
