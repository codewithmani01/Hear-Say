import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { CursorGlow } from '@/components/cursor-glow';

export const metadata: Metadata = {
  title: 'HearSay',
  description: 'Bring your text to life. Type, select a voice, and listen.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="font-body antialiased">
        <CursorGlow />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
