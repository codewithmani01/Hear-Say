"use client";

import { extractTextFromImage } from "@/ai/flows/extract-text-from-image";
import { translateText } from "@/ai/flows/translate-text";
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
import { Loader2, Pause, Play, ScanText, User, FileText, Image as ImageIcon, Languages } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const languages = [
  { value: "Spanish", label: "Spanish" },
  { value: "French", label: "French" },
  { value: "German", label: "German" },
  { value: "Japanese", label: "Japanese" },
  { value: "Mandarin Chinese", label: "Mandarin Chinese" },
  { value: "Hindi", label: "Hindi" },
  { value: "Arabic", label: "Arabic" },
  { value: "Urdu", label: "Urdu" },
  { value: "English", label: "English" },
];

export function HearSayClient() {
  const [text, setText] = useState(
    "Welcome to HearSay! With the browser's built-in speech synthesis, you can transform any text into natural-sounding speech, completely for free. Just type, choose a voice, and press play."
  );
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState("Spanish");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleVoicesChanged = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0) {
        // Try to find a default english voice, otherwise use the first available.
        const defaultVoice = availableVoices.find(v => v.lang.startsWith("en-US")) || availableVoices[0];
        setSelectedVoiceURI(defaultVoice.voiceURI);
      }
    };

    window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
    handleVoicesChanged();

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
    };
  }, []);


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

  const handleTranslate = async () => {
    if (!text.trim()) {
      toast({
        title: "No Text to Translate",
        description: "Please enter some text to translate.",
        variant: "destructive",
      });
      return;
    }

    setIsTranslating(true);
    try {
      const result = await translateText({ text, targetLanguage });
      setText(result.translatedText);
      toast({
        title: "Text Translated",
        description: `The text has been translated to ${targetLanguage}.`,
      });
    } catch (error) {
      console.error("Error translating text:", error);
      toast({
        title: "Error",
        description: "Failed to translate the text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleGenerateSpeech = () => {
    if (!text.trim() || !window.speechSynthesis) {
      toast({
        title: "Speech Synthesis not supported",
        description: "Your browser does not support the Web Speech API.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    const selectedVoice = voices.find(v => v.voiceURI === selectedVoiceURI);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsLoading(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      utteranceRef.current = null;
    };
    
    utterance.onerror = (event) => {
        console.error("SpeechSynthesisUtterance.onerror", event);
        toast({
            title: "Speech Error",
            description: "An error occurred during speech synthesis.",
            variant: "destructive",
        });
        setIsLoading(false);
        setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      if (utteranceRef.current && window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
          setIsPlaying(true);
      } else {
          handleGenerateSpeech();
      }
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
                ) : (
                  <div className="text-center p-4 text-muted-foreground">
                    <ImageIcon className="mx-auto h-12 w-12" />
                    <p className="mt-2 text-sm">Upload a file to see a preview</p>
                  </div>
                )}
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
              <div className="space-y-4">
                <Label htmlFor="language-select" className="text-lg font-semibold">
                  Translate
                </Label>
                <div className="flex gap-2">
                  <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                    <SelectTrigger id="language-select" className="w-full bg-transparent">
                      <SelectValue placeholder="Choose a language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleTranslate} disabled={isTranslating} variant="outline" className="bg-transparent">
                    {isTranslating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Label htmlFor="voice-select" className="text-lg font-semibold mt-4 block">
                Select a Voice
              </Label>
              <Select value={selectedVoiceURI} onValueChange={setSelectedVoiceURI}>
                <SelectTrigger
                  id="voice-select"
                  className="w-full h-14 text-base rounded-lg focus:ring-primary/50 bg-transparent"
                >
                  <SelectValue placeholder="Choose a voice" />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((voice) => (
                    <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                      <div className="flex items-center gap-3 py-1">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <User className="size-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{voice.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {voice.lang}
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="mt-8 flex flex-col items-center gap-4">
               <div className="flex items-center justify-center w-full gap-4">
                <Button
                    onClick={togglePlayPause}
                    variant="outline"
                    size="icon"
                    className="w-20 h-20 rounded-full border-2 border-primary/20 bg-background hover:bg-primary/10"
                    aria-label={isPlaying ? "Pause audio" : "Play audio"}
                    disabled={isLoading || !text.trim()}
                  >
                    {isPlaying ? (
                      <Pause className="h-8 w-8" />
                    ) : (
                      <Play className="h-8 w-8 ml-1" />
                    )}
                  </Button>
              </div>

              <Button
                onClick={handleGenerateSpeech}
                disabled={isLoading || !text.trim() || isPlaying}
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
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

    