import type { Metadata } from "next";
import { Nunito_Sans, Boldonse } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/contexts/AuthContext";

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800"],
});

const boldonse = Boldonse({
  variable: "--font-boldonse",
  subsets: ["latin"],
  weight: ["400"],
});

// Fetch system settings for metadata
async function getSystemSettings() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/admin/settings`, {
      cache: 'no-store', // Always fetch fresh settings
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Failed to fetch system settings for metadata:', error);
  }
  return {
    siteTitle: 'Farty Meople Scoring App',
    faviconUrl: null,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSystemSettings();

  return {
    title: settings.siteTitle || "Farty Meople Scoring App",
    description: "Track scores and statistics for your board game sessions",
    icons: {
      icon: settings.faviconUrl
        ? [
            {
              url: settings.faviconUrl,
              type: 'image/png',
            },
          ]
        : [
            {
              url: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎲</text></svg>',
              type: 'image/svg+xml',
            },
          ],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className={`${nunitoSans.variable} ${boldonse.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
