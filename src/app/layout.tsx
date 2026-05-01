import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT"],
});

export const metadata: Metadata = {
  title: {
    default: "The Reflection App — AI reflection coach for learners and educators",
    template: "%s · The Reflection App",
  },
  description:
    "The Reflection App turns student thinking, teacher reflection, and learning experiences into structured feedback, growth insights, and actionable next steps.",
  metadataBase: new URL("https://thereflectionapp.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          {children}
          <Toaster
            position="bottom-center"
            toastOptions={{
              classNames: {
                toast:
                  "rounded-xl border border-border bg-popover text-popover-foreground shadow-lg",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
