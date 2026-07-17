import type { Metadata, Viewport } from "next";
import DesktopGate from "@/components/DesktopGate";
import "./globals.css";

export const metadata: Metadata = {
  title: "VibeTok · 注意力劳动管理局",
  description: "人类贡献注意力，换取机器劳动。每一次交换生成一份不可修饰的公开账单。",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <DesktopGate>{children}</DesktopGate>
      </body>
    </html>
  );
}
