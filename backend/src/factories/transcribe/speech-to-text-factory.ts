import { AssemblyAiSpeechToTextAdapter } from "@/infrastructure/speech-to-text/assemblyai-speech-to-text-adapter";

export function createAssemblyAiSpeechToText(): AssemblyAiSpeechToTextAdapter {
  return new AssemblyAiSpeechToTextAdapter();
}
