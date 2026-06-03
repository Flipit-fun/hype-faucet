import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hype Faucet - Free Hype Tokens",
  description: "Get free Hype tokens on the Solana blockchain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
