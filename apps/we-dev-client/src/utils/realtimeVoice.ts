type SpeechRecognitionLike = new () => {
  lang: string; continuous: boolean; interimResults: boolean; onresult: ((event: any) => void) | null; onerror: ((event: any) => void) | null; onend: (() => void) | null; start: () => void; stop: () => void;
};

export class RealtimeVoiceController {
  private recognition: any = null;
  private speaking = false;
  constructor(private readonly onText: (text: string, final: boolean) => void, private readonly onState?: (state: "idle" | "listening" | "speaking" | "error") => void) {}
  start() {
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition as SpeechRecognitionLike | undefined;
    if (!Ctor) throw new Error("Speech Recognition در این محیط در دسترس نیست");
    this.recognition = new (Ctor as any)(); this.recognition.lang = "fa-IR"; this.recognition.continuous = true; this.recognition.interimResults = true;
    this.recognition.onresult = (event: any) => { let text = ""; let final = false; for (let i = event.resultIndex; i < event.results.length; i++) { text += event.results[i][0].transcript; final = event.results[i].isFinal; } if (text) this.onText(text, final); };
    this.recognition.onerror = () => this.onState?.("error"); this.recognition.onend = () => { this.speaking = false; this.onState?.("idle"); };
    this.recognition.start(); this.onState?.("listening");
  }
  stop() { this.recognition?.stop(); this.recognition = null; this.onState?.("idle"); }
  speak(text: string) { if (!text) return; window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = "fa-IR"; utterance.onstart = () => { this.speaking = true; this.onState?.("speaking"); }; utterance.onend = () => { this.speaking = false; this.onState?.("idle"); }; window.speechSynthesis.speak(utterance); }
  interrupt() { window.speechSynthesis.cancel(); this.speaking = false; this.onState?.("listening"); }
}
