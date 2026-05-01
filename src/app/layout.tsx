import type { Metadata } from "next";
import { Petrona, Atkinson_Hyperlegible } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const atkinson = Atkinson_Hyperlegible({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700"],
  display: "swap",
});

const petrona = Petrona({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Refleckt — a reflection coach for learners and educators",
    template: "%s · Refleckt",
  },
  description:
    "Refleckt turns a two-minute reflection into feedback you can act on, and a classroom dashboard you can read at a glance.",
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
      className={`${atkinson.variable} ${petrona.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider forcedTheme="light">
          {children}
          <Toaster
            position="bottom-center"
            toastOptions={{
              classNames: {
                toast:
                  "rounded-md border border-border bg-card text-card-foreground shadow-md",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
