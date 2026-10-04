export type Language = "rw" | "en";

export interface Source {
  title: string;
  source: string | null;
  url: string | null;
  similarity: number;
}

export interface PhotoDiagnosis {
  is_plant: boolean;
  crop: string | null;
  problem: string;
  alternatives: string[];
  confidence: "high" | "medium" | "low";
  symptoms: string;
}

export interface AskResponse {
  request_id: string;
  session_id: string;
  answer: string;
  language: Language;
  crop: string | null;
  dimension: string | null;
  sources: Source[];
  model: string;
  system_version: string;
  prompt_version: string;
  latency_ms: number;
  flags: string[];
  photo?: PhotoDiagnosis | null;
}

export interface ChatMessage {
  id: string;
  role: "farmer" | "advisor";
  text: string;
  response?: AskResponse;
  error?: boolean;
  imageUrl?: string;
}
