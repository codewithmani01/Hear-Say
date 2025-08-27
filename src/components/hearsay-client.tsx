"use client";

import { adjustIntonation } from "@/ai/flows/adjust-intonation";
import { extractTextFromImage } from "@/ai/flows/extract-text-from-image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Loader2, Pause, Play, ScanText, User, FileText, Image as ImageIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const voices = [
    { id: 'algenib', name: 'Algenib', gender: 'Female', description: 'Clear and professional' },
    { id: 'gacrux', name: 'Gacrux', gender: 'Male', description: 'Deep and resonant' },
    { id: 'umbriel', name: 'Umbriel', gender: 'Male', description: 'Warm and friendly' },
    { id: 'vindemiatrix', name: 'Vindemiatrix', gender: 'Female', description: 'Bright and energetic' },
    { id: 'despina', name: 'Despina', gender: 'Female', description: 'Calm and soothing' },
    { id: 'zubenelgenubi', name: 'Zubenelgenubi', gender: 'Male', description: 'Authoritative and crisp' },
    { id: 'achernar', name: 'Achernar', gender: 'Male', description: 'Smooth and melodic' },
    { id: 'achird', name: 'Achird', gender: 'Female', description: 'Gentle and kind' },
    { id: 'algieba', name: 'Algieba', gender: 'Male', description: 'Powerful and commanding' },
    { id: 'alnilam', name: 'Alnilam', gender: 'Female', description: 'Graceful and elegant' },
    { id: 'aoede', name: 'Aoede', gender: 'Female', description: 'Lively and animated' },
    { id: 'autonoe', name: 'Autonoe', gender: 'Female', description: 'Robotic and futuristic' },
    { id: 'callirrhoe', name: 'Callirrhoe', gender: 'Female', description: 'Sweet and caring' },
    { id: 'charon', name: 'Charon', gender: 'Male', description: 'Mysterious and deep' },
    { id: 'enceladus', name: 'Enceladus', gender: 'Male', description: 'Heroic and epic' },
    { id: 'erinome', name: 'Erinome', gender: 'Female', description: 'Confident and clear' },
    { id: 'fenrir', name: 'Fenrir', gender: 'Male', description: 'Gruff and strong' },
    { id: 'iapetus', name: 'Iapetus', gender: 'Male', description: 'Wise and old' },
    { id: 'kore', name: 'Kore', gender: 'Female', description: 'Youthful and playful' },
    { id: 'laomedeia', name: 'Laomedeia', gender: 'Female', description: 'Sophisticated and calm' },
    { id: 'leda', name: 'Leda', gender: 'Female', description: 'Storyteller' },
    { id: 'puck', name: 'Puck', gender: 'Male', description: 'Mischievous and fun' },
    { id: 'pulcherrima', name: 'Pulcherrima', gender: 'Female', description: 'Elegant and refined' },
    { id: 'rasalgethi', name: 'Rasalgethi', gender: 'Male', description: 'Regal and noble' },
    { id: 'sadachbia', name: 'Sadachbia', gender: 'Female', description: 'Enthusiastic and upbeat' },
    { id: 'sadaltager', name: 'Sadaltager', gender: 'Male', description: 'Friendly and approachable' },
    { id: 'schedar', name: 'Schedar', gender: 'Female', description: 'Warm and motherly' },
    { id: 'sulafat', name: 'Sulafat', gender: 'Male', description: 'Calm and reassuring' },
    { id: 'zephyr', name: 'Zephyr', gender: 'Male', description: 'Light and airy' },
];

export function HearSayClient() {
  const [text, setText] = useState(
    "Welcome to HearSay! With our advanced AI, you can transform any text into natural-sounding speech. Just type, choose a voice, and press play. Experience the future of text-to-speech."
  );
  const [selectedVoice, setSelectedVoice] = useState(voices[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        }
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleExtractText = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select an image or PDF file to extract text from.",
        variant: "destructive",
      });
      return;
    }

    setIsExtracting(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onloadend = async () => {
        const fileDataUri = reader.result as string;
        const result = await extractTextFromImage({ imageDataUri: fileDataUri });
        setText(result.extractedText);
        toast({
          title: "Text Extracted",
          description: "The text from the file has been loaded into the textbox.",
        });
      };
      reader.onerror = () => {
        throw new Error("Failed to read the file.");
      }
    } catch (error) {
      console.error("Error extracting text:", error);
      toast({
        title: "Error",
        description: "Failed to extract text from the file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

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
    <Card className="w-full max-w-6xl mx-auto shadow-2xl overflow-hidden rounded-2xl border-primary/10 bg-white/10 dark:bg-black/10 backdrop-blur-lg border dark:border-white/10">
      <CardHeader className="text-center bg-transparent p-6 md:p-8">
        <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">
          HearSay
        </h1>
        <CardDescription className="text-lg text-foreground/80 mt-1">
          Bring your text to life. Type, select a voice, and listen. Or extract text from an image or PDF.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid md:grid-cols-2 lg:grid-cols-3">
           <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-white/10">
            <div className="space-y-4 h-full flex flex-col">
              <Label htmlFor="image-upload" className="text-lg font-semibold">
                Upload Image or PDF
              </Label>
              <div className="w-full h-48 flex items-center justify-center bg-muted/50 dark:bg-black/20 rounded-lg">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                ) : selectedFile ? (
                  <div className="text-center p-4">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground break-all">{selectedFile.name}</p>
                  </div>
                ) : null}
              </div>

              <Input id="image-upload" type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="bg-transparent" />
              <Button onClick={handleExtractText} disabled={isExtracting || !selectedFile} className="w-full">
                {isExtracting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <ScanText className="mr-2 h-4 w-4" />
                    Extract Text
                  </>
                )}
              </Button>
            </div>
          </div>
          <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-white/10 md:col-span-1 lg:col-span-1">
            <div className="space-y-4 h-full flex flex-col">
              <Label htmlFor="text-input" className="text-lg font-semibold">
                Your Text
              </Label>
              <Textarea
                id="text-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your text here..."
                className="flex-grow text-base resize-none rounded-lg focus-visible:ring-primary/50 bg-transparent"
                rows={12}
              />
              <p className="text-sm text-muted-foreground text-right">
                {text.length} characters
              </p>
            </div>
          </div>
          <div className="p-6 md:p-8 bg-primary/5 dark:bg-black/10 flex flex-col justify-between md:col-span-2 lg:col-span-1">
            <div className="space-y-4">
              <Label htmlFor="voice-select" className="text-lg font-semibold">
                Select a Voice
              </Label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger
                  id="voice-select"
                  className="w-full h-14 text-base rounded-lg focus:ring-primary/50 bg-transparent"
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
                className="w-full h-14 text-lg font-bold rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-100 bg-primary/90 hover:bg-primary"
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
