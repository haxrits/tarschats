import "./globals.css";
import Providers from "../components/Providers";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans bg-[#f5f7fb] text-gray-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}