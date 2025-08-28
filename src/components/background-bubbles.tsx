"use client";

export function BackgroundBubbles() {
  return (
    <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden">
      <div className="absolute w-64 h-64 bg-primary/10 rounded-full filter blur-2xl -top-16 -left-16 animate-bubble-1"></div>
      <div className="absolute w-48 h-48 bg-accent/10 rounded-full filter blur-2xl top-1/2 left-1/4 animate-bubble-2"></div>
      <div className="absolute w-32 h-32 bg-secondary/10 rounded-full filter blur-2xl bottom-0 right-0 animate-bubble-3"></div>
      <div className="absolute w-56 h-56 bg-primary/5 rounded-full filter blur-2xl bottom-16 right-1/3 animate-bubble-4"></div>
    </div>
  );
}
