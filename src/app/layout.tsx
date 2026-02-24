import type { Metadata } from 'next';
import Script from 'next/script';
import NavTabs from './components/NavTabs';
import './globals.css';

export const metadata: Metadata = {
  title: 'Travel Data Hub',
  description: 'Event dashboard aggregating data from KudaGo and OpenF1 APIs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-gray-950">
      <head>
        <Script
          src="https://emrldtp.cc/NTAxOTM5.js?t=501939"
          strategy="afterInteractive"
        />
      </head>
      <body className="bg-gray-950 text-gray-100 min-h-screen antialiased">
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                </div>
                <span className="font-semibold text-gray-100 tracking-tight">
                  Travel Data Hub
                </span>
              </div>
              <div className="h-4 w-px bg-gray-700 mx-1" />
              <NavTabs />
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-gray-800 py-4 text-center text-xs text-gray-600">
            Travel Data Hub &mdash; KudaGo &middot; Ticketmaster &middot; OpenF1 &middot; Aviasales &middot; hh.ru
          </footer>
        </div>
      </body>
    </html>
  );
}
