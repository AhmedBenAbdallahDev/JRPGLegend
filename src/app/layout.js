import { Open_Sans, Dela_Gothic_One } from "next/font/google";
import "./globals.css";
import { SettingsProvider } from "@/context/SettingsContext";
import ThemeProvider from "@/components/ThemeProvider";

const openSansFont = Open_Sans({
  subsets: ["latin"],
  variable: "--body-font",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const delaGothicFont = Dela_Gothic_One({
  subsets: ["latin"],
  variable: "--heading-font",
  weight: ["400"],
  display: "swap",
});

export const metadata = {
  title: "The Next Game Platform",
  description: "Retro gaming platform.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${openSansFont.variable} ${delaGothicFont.variable} antialiased`}
      >
        <SettingsProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
