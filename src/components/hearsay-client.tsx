"use client";

import { extractTextFromImage } from "@/ai/flows/extract-text-from-image";
import { translateText } from "@/ai/flows/translate-text";
import { correctGrammar } from "@/ai/flows/correct-grammar";
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
import { Loader2, ScanText, User, FileText, Image as ImageIcon, Languages, StopCircle, SpellCheck } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

const languages = [
  { value: "English", label: "English" },
  { value: "Spanish", label: "Spanish" },
  { value: "French", label: "French" },
  { value: "German", label: "German" },
  { value: "Japanese", label: "Japanese" },
  { value: "Mandarin Chinese", label: "Mandarin Chinese" },
  { value: "Hindi", label: "Hindi" },
  { value: "Arabic", label: "Arabic" },
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
  const [isCorrectingGrammar, setIsCorrectingGrammar] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState("English");
  const [textLanguage, setTextLanguage] = useState("en-US");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const { toast } = useToast();

  const findBestVoiceForLanguage = useCallback((lang: string, availableVoices: SpeechSynthesisVoice[]) => {
    // Exact match "en-US"
    let bestVoice = availableVoices.find(v => v.lang === lang);
    if (bestVoice) return bestVoice;

    // Language prefix match "en-"
    const langPrefix = lang.split('-')[0];
    bestVoice = availableVoices.find(v => v.lang.startsWith(langPrefix + "-"));
    if (bestVoice) return bestVoice;
    
    // Base language match "en"
    bestVoice = availableVoices.find(v => v.lang === langPrefix);
    if (bestVoice) return bestVoice;

    // Default to first available voice if no match is found
    return null;
  }, []);

  useEffect(() => {
    const handleVoicesChanged = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedVoiceURI) {
        const defaultVoice = findBestVoiceForLanguage(textLanguage, availableVoices) || availableVoices.find(v => v.default);
        if (defaultVoice) {
          setSelectedVoiceURI(defaultVoice.voiceURI);
        }
      }
    };

    window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
    handleVoicesChanged(); // Call it once to get the initial list

    const handleBeforeUnload = () => {
        window.speechSynthesis.cancel();
    }
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [textLanguage, findBestVoiceForLanguage, selectedVoiceURI]);


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
        description: "Please select an image file to extract text from.",
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

        if (!result.isClear) {
           toast({
            title: "Image Not Clear",
            description: "The uploaded image is not clear enough to read. Please try another image.",
            variant: "destructive",
          });
        } else {
          setText(result.extractedText);
          toast({
            title: "Text Extracted",
            description: "The text from the file has been loaded into the textbox.",
          });
        }

        setTextLanguage("en-US"); // Assume extracted text is English
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

      // A simple map for language names to BCP 47 codes
      const langCodeMap: { [key: string]: string } = {
          "Spanish": "es",
          "French": "fr",
          "German": "de",
          "Japanese": "ja",
          "Mandarin Chinese": "zh",
          "Hindi": "hi",
          "Arabic": "ar",
          "English": "en",
      };
      const newLang = langCodeMap[targetLanguage] || 'en';
      setTextLanguage(newLang);

      const bestVoice = findBestVoiceForLanguage(newLang, voices);
      if (bestVoice) {
        setSelectedVoiceURI(bestVoice.voiceURI);
      } else {
        setSelectedVoiceURI(undefined);
      }

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

  const handleCorrectGrammar = async () => {
    if (!text.trim()) {
      toast({
        title: "No Text to Correct",
        description: "Please enter some text to correct.",
        variant: "destructive",
      });
      return;
    }

    setIsCorrectingGrammar(true);
    try {
      const result = await correctGrammar({ text });
      setText(result.correctedText);
      toast({
        title: "Grammar Corrected",
        description: "The text has been updated with grammar corrections.",
      });
    } catch (error) {
      console.error("Error correcting grammar:", error);
      toast({
        title: "Error",
        description: "Failed to correct the grammar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCorrectingGrammar(false);
    }
  }

  const handleGenerateSpeech = () => {
    if (!text.trim() || !window.speechSynthesis) {
      return;
    }
    
    const selectedVoice = voices.find(v => v.voiceURI === selectedVoiceURI);
    if (!selectedVoice) {
      return;
    }

    setIsLoading(true);
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice.lang;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsLoading(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      utteranceRef.current = null;
    };
    
    utterance.onerror = (event) => {
        setIsLoading(false);
        setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePlayback = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      handleGenerateSpeech();
    }
  };
  
  const canPlay = !!voices.find(v => v.voiceURI === selectedVoiceURI);
  const selectedVoice = voices.find(v => v.voiceURI === selectedVoiceURI);

  return (
    <Card className="w-full max-w-6xl mx-auto shadow-2xl overflow-hidden rounded-2xl border-primary/10 bg-white/10 dark:bg-black/10 backdrop-blur-lg border dark:border-white/10">
      <CardHeader className="text-center bg-transparent p-6 md:p-8">
        <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">
          HearSay
        </h1>
        <CardDescription className="text-lg text-foreground/80 mt-1">
          Bring your text to life. Type, select a voice, and listen. Or extract text from an image.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid md:grid-cols-2 lg:grid-cols-3">
           <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-white/10">
            <div className="space-y-4 h-full flex flex-col">
              <Label htmlFor="image-upload" className="text-lg font-semibold">
                Upload Image
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
                    <p className="mt-2 text-sm">Upload an image to see a preview</p>
                  </div>
                )}
              </div>

              <Input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} className="bg-transparent" />
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
              <div className="flex items-center justify-between">
                <Label htmlFor="text-input" className="text-lg font-semibold">
                  Your Text
                </Label>
                <Button onClick={handleCorrectGrammar} disabled={isCorrectingGrammar} variant="outline" size="sm" className="bg-transparent">
                  {isCorrectingGrammar ? <Loader2 className="h-4 w-4 animate-spin" /> : <SpellCheck className="h-4 w-4" />}
                  <span className="ml-2">Correct Grammar</span>
                </Button>
              </div>
              <Textarea
                id="text-input"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (isPlaying) {
                    window.speechSynthesis.cancel();
                  }
                  // Simple language detection hint for RTL languages
                  if (/[\u0600-\u06FF\u0750-\u077F]/.test(e.target.value)) { // Arabic script
                      setTextLanguage('ar');
                  } else {
                      setTextLanguage('en-US'); // Default back to english
                  }
                }}
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
                    <SelectTrigger id="language-select" className="w-full bg-white/10 dark:bg-black/10 backdrop-blur-lg">
                      <SelectValue placeholder="Choose a language" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/10 dark:bg-black/10 backdrop-blur-lg">
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
                  className="w-full h-14 text-base rounded-lg focus:ring-primary/50 bg-white/10 dark:bg-black/10 backdrop-blur-lg"
                  disabled={voices.length === 0}
                >
                    <SelectValue>
                      <div className="flex items-center gap-3">
                         <div className="bg-primary/10 p-2 rounded-full">
                          <User className="size-5 text-primary" />
                        </div>
                        <div className="flex flex-col items-start text-left">
                          <p className="font-medium truncate">{selectedVoice?.name ?? 'Choose a voice'}</p>
                           {selectedVoice && <p className="text-xs text-muted-foreground">{selectedVoice.lang}</p>}
                        </div>
                      </div>
                    </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white/10 dark:bg-black/10 backdrop-blur-lg">
                  {voices.map((voice) => (
                    <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                      <div className="flex items-center gap-3 py-1">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <User className="size-5 text-primary" />
                        </div>
                        <div className="flex flex-col items-start">
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
               <Button
                onClick={handlePlayback}
                disabled={isLoading || !text.trim() || !canPlay}
                className="w-full h-14 text-lg font-bold rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-100 bg-primary/90 hover:bg-primary"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Generating...
                  </>
                ) : isPlaying ? (
                  <>
                    <StopCircle className="mr-2 h-6 w-6" />
                    Stop
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
