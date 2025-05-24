
export enum VideoDuration {
  THIRTY_SECONDS = "30s",
  SIXTY_SECONDS = "60s",
}

export interface ScriptSegment {
  id: string;
  text: string;
}

export interface VisualIdea {
  id: string;
  description: string;
  imageUrl: string; // Placeholder image URL
}

export interface GeneratedVideo {
  topic: string;
  scriptSegments: ScriptSegment[];
  visualIdeas: VisualIdea[];
  keyPhrases: string[];
  duration: VideoDuration;
  titleSuggestion: string;
}

export interface Topic {
  id: string;
  text: string;
  status: "pending" | "processing" | "completed" | "error";
  error?: string;
  generatedVideo?: GeneratedVideo;
}

// This is a browser's built-in type, but we declare it for clarity if needed elsewhere.
// export interface SpeechSynthesisVoice {
//   default: boolean;
//   lang: string;
//   localService: boolean;
//   name: string;
//   voiceURI: string;
// }

export interface GeminiResponseJson {
  title_suggestion: string;
  script_segments: Array<{ segment_text: string }>;
  visual_ideas: string[]; // Array of descriptions
  key_phrases: string[];
}
