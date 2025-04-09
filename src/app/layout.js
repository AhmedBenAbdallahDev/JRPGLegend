import { Urbanist } from "next/font/google";
import "./globals.css";

const urbanistFont = Urbanist({
  subsets: ["latin"],
  variable: "--font-urbanist",
  display: "swap",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  title: "The Next Game Platform",
  description: "Retro gaming platform.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${urbanistFont.variable} antialiased bg-main font-urbanist`}
      >
        {children}
      </body>
    </html>
  );
}
