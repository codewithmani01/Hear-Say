import { HearSayClient } from '@/components/hearsay-client';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen w-full p-4">
      <div className="fixed top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-50 via-white to-cyan-100 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 -z-10" />
      <HearSayClient />
    </main>
  );
}
