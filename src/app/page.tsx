"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mic, AlertTriangle, Send, Trash2 } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { useRecorder } from "@/hooks/use-recorder";
import { useToast } from "@/hooks/use-toast";
import { processAudio, sendToNotion } from "@/app/actions";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type AppState = "idle" | "recording" | "processing" | "preview" | "error";
type Note = { title: string; content: string };

const noteSchema = z.object({
  title: z.string().min(1, "Title cannot be empty."),
  content: z.string().min(1, "Content cannot be empty."),
});

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [appState, setAppState] = useState<AppState>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { startRecording, stopRecording, isRecording } = useRecorder();

  const form = useForm<z.infer<typeof noteSchema>>({
    resolver: zodResolver(noteSchema),
    defaultValues: { title: "", content: "" },
  });

  const handleStartRecording = async () => {
    try {
      await startRecording();
      setAppState("recording");
      if (navigator.vibrate) navigator.vibrate(100);
    } catch (err) {
      setError("Could not start recording. Please check microphone permissions.");
      setAppState("error");
    }
  };

  const handleStopRecording = async () => {
    try {
      setAppState("processing");
      if (navigator.vibrate) navigator.vibrate(50);
      const blob = await stopRecording();
      setAudioBlob(blob);
      await processAndDisplay(blob);
    } catch (err) {
      setError("An error occurred during recording.");
      setAppState("error");
    }
  };

  const processAndDisplay = async (blob: Blob) => {
    try {
      const dataUri = await blobToDataUri(blob);
      const result = await processAudio(dataUri);
      if (result.error) {
        throw new Error(result.error);
      }
      form.reset(result.note);
      setAppState("preview");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during processing.";
      setError(`Failed to process audio. ${errorMessage}`);
      setAppState("error");
    }
  };

  const handleRetry = async () => {
    if (!audioBlob) {
      setAppState('idle');
      return;
    }
    setAppState("processing");
    await processAndDisplay(audioBlob);
  };
  
  const handleDiscard = () => {
    setAudioBlob(null);
    form.reset({ title: "", content: "" });
    setAppState("idle");
  }

  const handleSendToNotion = async (data: z.infer<typeof noteSchema>) => {
    setAppState("processing");
    try {
      const result = await sendToNotion(data.title, data.content);
      if (result.error) {
        throw new Error(result.error);
      }
      toast({
        title: "Success!",
        description: "Your note has been sent to Notion.",
      });
      handleDiscard();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send note to Notion. Please try again.",
      });
      setAppState("preview"); // Go back to preview on failure
    }
  };
  
  const blobToDataUri = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(blob);
    });
  }

  if (!user) {
    // This should not happen with the mock user, but it's a good safeguard.
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center p-4 text-center">
        <div className="w-full max-w-2xl">
          {appState === 'idle' && (
            <div className="flex flex-col items-center gap-4">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Gemini to Notion</h1>
              <p className="text-lg text-muted-foreground">Tap the button to start recording your voice note.</p>
              <RecordButton isRecording={false} onClick={handleStartRecording} />
            </div>
          )}

          {appState === 'recording' && (
             <div className="flex flex-col items-center gap-4">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Recording...</h1>
              <p className="text-lg text-muted-foreground">Tap the button to stop.</p>
              <RecordButton isRecording={true} onClick={handleStopRecording} />
            </div>
          )}

          {appState === 'processing' && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <p className="text-lg text-muted-foreground">Processing your note...</p>
            </div>
          )}

          {appState === 'preview' && (
            <FormProvider {...form}>
              <form onSubmit={form.handleSubmit(handleSendToNotion)}>
                <Card className="text-left">
                  <CardHeader>
                    <CardTitle>Preview Your Note</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Your note's title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Your note's content..." rows={10} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="justify-end gap-2">
                    <Button variant="ghost" type="button" onClick={handleDiscard}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Discard
                    </Button>
                    <Button type="submit" variant="secondary">
                       <Send className="mr-2 h-4 w-4" />
                      Send to Notion
                    </Button>
                  </CardFooter>
                </Card>
              </form>
            </FormProvider>
          )}

          {appState === 'error' && (
            <Card className="w-full">
              <CardHeader className="items-center">
                 <AlertTriangle className="h-12 w-12 text-destructive" />
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-lg font-medium">An Error Occurred</p>
                <p className="text-muted-foreground">{error}</p>
              </CardContent>
              <CardFooter className="justify-center gap-4">
                <Button variant="outline" onClick={() => setAppState('idle')}>Start Over</Button>
                {audioBlob && <Button onClick={handleRetry}>Retry</Button>}
              </CardFooter>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

function RecordButton({ isRecording, onClick }: { isRecording: boolean; onClick: () => void }) {
  return (
    <div className="relative my-8">
      {isRecording && (
        <div className="absolute inset-0 rounded-full bg-destructive/50 animate-pulse"></div>
      )}
      <Button
        onClick={onClick}
        className={`relative h-24 w-24 rounded-full shadow-lg transition-colors duration-300 ${isRecording ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'}`}
      >
        <Mic className="h-10 w-10 text-primary-foreground" />
      </Button>
    </div>
  );
}
