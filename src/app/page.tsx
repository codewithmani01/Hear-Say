import { BackgroundBubbles } from '@/components/background-bubbles';
import { HearSayClient } from '@/components/hearsay-client';
import { Instagram, Mail } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow flex flex-col items-center justify-center w-full p-4 relative">
        <BackgroundBubbles />
        <HearSayClient />
      </main>
      <footer className="w-full text-center p-4 text-foreground/60">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>&copy; {new Date().getFullYear()} Emmanuel. All rights reserved.</p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <p>Contact me for technical issues:</p>
            <div className="flex items-center gap-4">
              <a href="mailto:codewithemmanuel@gmail.com" aria-label="Email" className="hover:text-primary transition-colors">
                <Mail className="size-5" />
              </a>
              <a href="https://instagram.com/maniop.404" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-primary transition-colors">
                <Instagram className="size-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
