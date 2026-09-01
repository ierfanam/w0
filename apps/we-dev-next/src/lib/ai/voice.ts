export interface VoiceSessionConfig { language: "fa"; autoDetectLanguage: true; input: "microphone"; output: "audio"; vad: boolean; interruption: boolean; streaming: boolean; }

export function getVoiceSessionConfig(): VoiceSessionConfig {
  return { language: "fa", autoDetectLanguage: true, input: "microphone", output: "audio", vad: true, interruption: true, streaming: true };
}

export function normalizeVoiceText(text: string) { return text.replace(/[\u200c]{2,}/g, "\u200c").trim(); }
