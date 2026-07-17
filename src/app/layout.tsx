import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VibeTok",
  description: "人类贡献注意力，换取机器劳动。",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
