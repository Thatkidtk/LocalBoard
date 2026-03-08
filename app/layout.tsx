import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope, Space_Grotesk } from "next/font/google";

import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/auth";
import { getNotifications } from "@/lib/data/queries";

import "./globals.css";

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "LocalBoard",
  description: "Location-based community discussions for neighborhoods, ZIP codes, and city blocks.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUserPromise = getCurrentUser();
  const notificationsPromise = getNotifications();

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body
        className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable} antialiased`}
      >
        <AppFrame currentUserPromise={currentUserPromise} notificationsPromise={notificationsPromise}>
          {children}
        </AppFrame>
      </body>
    </html>
  );
}

async function AppFrame({
  children,
  currentUserPromise,
  notificationsPromise,
}: {
  children: React.ReactNode;
  currentUserPromise: ReturnType<typeof getCurrentUser>;
  notificationsPromise: ReturnType<typeof getNotifications>;
}) {
  const [currentUser, notifications] = await Promise.all([
    currentUserPromise,
    notificationsPromise,
  ]);

  return (
    <AppShell currentUser={currentUser} notifications={notifications}>
      {children}
    </AppShell>
  );
}
