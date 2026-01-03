"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mic, AlertTriangle, Send, Trash2, Save, UploadCloud, Hourglass } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";

type AppState = "idle" | "recording" | "processing" | "preview" | "error";
type Note = { title: string; content: string; categories: string[] };

const noteSchema = z.object({
  title: z.string().min(1, "Title cannot be empty."),
  content: z.string().min(1, "Content cannot be empty."),
  categories: z.array(z.string()).optional(),
});

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [appState, setAppState] = useState<AppState>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedNotes, setSavedNotes] = useState<Note[]>([]);
  
  const { startRecording, stopRecording, isRecording } = useRecorder();

  const form = useForm<z.infer<typeof noteSchema>>({
    resolver: zodResolver(noteSchema),
    defaultValues: { title: "", content: "", categories: [] },
  });

  useEffect(() => {
    // Load saved notes from localStorage on component mount
    const storedNotes = localStorage.getItem("savedNotes");
    if (storedNotes) {
      setSavedNotes(JSON.parse(storedNotes));
    }
  }, []);

  const updateAndStoreNotes = (newNotes: Note[]) => {
    setSavedNotes(newNotes);
    localStorage.setItem("savedNotes", JSON.stringify(newNotes));
  }

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
    form.reset({ title: "", content: "", categories: [] });
    setAppState("idle");
  }

  const handleSendToNotion = async (data: z.infer<typeof noteSchema>) => {
    setAppState("processing");
    try {
      const result = await sendToNotion(data.title, data.content, data.categories || []);
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
        description: `Failed to send note to Notion. ${err instanceof Error ? err.message : ''}`,
      });
      setAppState("preview"); // Go back to preview on failure
    }
  };

  const handleSaveLocally = (data: Note) => {
    const newNotes = [...savedNotes, data];
    updateAndStoreNotes(newNotes);
    toast({
      title: "Note Saved",
      description: "Your note has been saved locally.",
    });
    handleDiscard();
  }

  const handleDeleteSavedNote = (index: number) => {
    const newNotes = savedNotes.filter((_, i) => i !== index);
    updateAndStoreNotes(newNotes);
    toast({
      title: "Note Deleted",
      description: "The saved note has been removed.",
    });
  }

  const handleUploadSavedNote = async (note: Note, index: number) => {
     try {
      const result = await sendToNotion(note.title, note.content, note.categories || []);
      if (result.error) {
        throw new Error(result.error);
      }
      toast({
        title: "Success!",
        description: "Your saved note has been sent to Notion.",
      });
      // Remove the note after successful upload
      const newNotes = savedNotes.filter((_, i) => i !== index);
      updateAndStoreNotes(newNotes);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: `Could not send to Notion. Please check your connection and try again.`,
      });
    }
  }
  
  const blobToDataUri = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(blob);
    });
  }

  if (!user) {
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
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Notes to Notion</h1>
              <p className="text-lg text-muted-foreground">Tap the button to start recording your voice note.</p>
              <RecordButton isRecording={false} onClick={handleStartRecording} />

              {savedNotes.length > 0 && (
                <div className="mt-8 w-full">
                  <h2 className="text-2xl font-semibold mb-4">Saved Notes</h2>
                  <div className="space-y-4">
                    {savedNotes.map((note, index) => (
                       <Card key={index} className="text-left">
                        <CardContent className="p-4">
                          <p className="font-bold truncate">{note.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">{note.content}</p>
                           <div className="flex flex-wrap gap-1 mt-2">
                              {note.categories?.map(category => (
                                <Badge key={category} variant="secondary" className="text-xs">{category}</Badge>
                              ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end gap-2 p-2 pt-0">
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteSavedNote(index)}>
                            <Trash2 className="h-4 w-4"/>
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleUploadSavedNote(note, index)}>
                            <UploadCloud className="mr-2 h-4 w-4" />
                            Upload
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
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
                     <FormField
                      control={form.control}
                      name="categories"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categories</FormLabel>
                          <FormControl>
                             <div className="flex flex-wrap gap-2">
                              {field.value?.map(category => (
                                <Badge key={category} variant="secondary">{category}</Badge>
                              ))}
                            </div>
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
                    <Button variant="outline" type="button" onClick={() => handleSaveLocally(form.getValues())}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Locally
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
