import type { Metadata } from "next";
import AuthProvider from "@/components/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "MoraHub — Nền Tảng API AI",
  description: "Truy cập mọi model AI qua một API. OpenAI, Claude, Gemini, DeepSeek... Thanh toán theo nhu cầu.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        <ThemeProvider>
          <AuthProvider>
          {children}
          <Toaster richColors position="top-right" />
        </AuthProvider>
          </ThemeProvider>
      </body>
    </html>
  );
}
