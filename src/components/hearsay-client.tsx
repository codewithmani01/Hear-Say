"use client";

import { adjustIntonation } from "@/ai/flows/adjust-intonation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Pause, Play, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const voices = [
  {
    id: "Algenib",
    name: "Algenib",
    gender: "Female",
    description: "Clear and professional",
  },
  {
    id: "Antares",
    name: "Antares",
    gender: "Male",
    description: "Deep and resonant",
  },
  {
    id: "Arcturus",
    name: "Arcturus",
    gender: "Male",
    description: "Warm and friendly",
  },
  {
    id: "Capella",
    name: "Capella",
    gender: "Female",
    description: "Bright and energetic",
  },
  {
    id: "Deneb",
    name: "Deneb",
    gender: "Female",
    description: "Calm and soothing",
  },
  {
    id: "Rigel",
    name: "Rigel",
    gender: "Male",
    description: "Authoritative and crisp",
  },
];

export function HearSayClient() {
  const [text, setText] = useState(
    "Welcome to HearSay! With our advanced AI, you can transform any text into natural-sounding speech. Just type, choose a voice, and press play. Experience the future of text-to-speech."
  );
  const [selectedVoice, setSelectedVoice] = useState(voices[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const handleGenerateSpeech = async () => {
    if (!text.trim()) {
      toast({
        title: "Empty Text",
        description: "Please enter some text to generate speech.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    setAudioSrc(null);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    try {
      const result = await adjustIntonation({ text, voiceName: selectedVoice });
      setAudioSrc(result.media);
    } catch (error) {
      console.error("Error generating speech:", error);
      toast({
        title: "Error",
        description: "Failed to generate speech. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (audioSrc && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [audioSrc]);

  useEffect(() => {
    const audioElement = audioRef.current;
    const handleEnded = () => setIsPlaying(false);

    if (audioElement) {
      audioElement.addEventListener("ended", handleEnded);
      return () => {
        audioElement.removeEventListener("ended", handleEnded);
      };
    }
  }, []);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-2xl overflow-hidden rounded-2xl border-primary/10">
      <CardHeader className="text-center bg-card/50 p-6 md:p-8">
        <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">
          HearSay
        </h1>
        <CardDescription className="text-lg text-foreground/80 mt-1">
          Bring your text to life. Type, select a voice, and listen.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid md:grid-cols-2">
          <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r">
            <div className="space-y-4 h-full flex flex-col">
              <Label htmlFor="text-input" className="text-lg font-semibold">
                Your Text
              </Label>
              <Textarea
                id="text-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your text here..."
                className="flex-grow text-base resize-none rounded-lg focus-visible:ring-primary/50"
                rows={12}
              />
              <p className="text-sm text-muted-foreground text-right">
                {text.length} characters
              </p>
            </div>
          </div>
          <div className="p-6 md:p-8 bg-primary/5 flex flex-col justify-between">
            <div className="space-y-4">
              <Label htmlFor="voice-select" className="text-lg font-semibold">
                Select a Voice
              </Label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger
                  id="voice-select"
                  className="w-full h-14 text-base rounded-lg focus:ring-primary/50"
                >
                  <SelectValue placeholder="Choose a voice" />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      <div className="flex items-center gap-3 py-1">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <User className="size-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{voice.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {voice.gender} &middot; {voice.description}
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="mt-8 flex flex-col items-center gap-4">
              <Button
                onClick={handleGenerateSpeech}
                disabled={isLoading || !text.trim()}
                className="w-full h-14 text-lg font-bold rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-100"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Hear It Now"
                )}
              </Button>
              {audioSrc && (
                <div className="w-full flex justify-center mt-4">
                  <Button
                    onClick={togglePlayPause}
                    variant="outline"
                    size="icon"
                    className="w-20 h-20 rounded-full border-2 border-primary/20 bg-background hover:bg-primary/10 data-[state=playing]:bg-primary data-[state=playing]:text-primary-foreground"
                    data-state={isPlaying ? "playing" : "paused"}
                    aria-label={isPlaying ? "Pause audio" : "Play audio"}
                  >
                    {isPlaying ? (
                      <Pause className="h-8 w-8" />
                    ) : (
                      <Play className="h-8 w-8 ml-1" />
                    )}
                  </Button>
                  <audio ref={audioRef} src={audioSrc} className="hidden" />
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
