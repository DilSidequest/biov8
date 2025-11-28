import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Medical Portal",
  description: "Doctor and Nurse prescription management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased bg-slate-900 text-white">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}

