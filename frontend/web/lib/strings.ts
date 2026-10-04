import type { Language } from "./types";

// Kinyarwanda strings must be reviewed by a native speaker before the demo.
export const strings = {
  rw: {
    title: "Umujyanama w'Ubuhinzi",
    subtitle: "Baza ikibazo cy'ubuhinzi ku bigori, ibishyimbo n'ibirayi.",
    placeholder: "Andika ikibazo cyawe…",
    send: "Ohereza",
    sources: "Aho amakuru yavuye",
    newChat: "Ikiganiro gishya",
    tryThese: "Gerageza kimwe muri ibi bibazo",
    error:
      "Igisubizo nticyabonetse. Reba ko seriveri ikora, hanyuma wongere ugerageze.",
    crop: "Igihingwa",
    topic: "Ingingo",
    time: "Igihe",
    you: "Wowe",
    advisor: "Umujyanama",
    stepRead: "Turimo gusoma ikibazo cyawe…",
    stepSearch: "Turashaka amakuru mu nyandiko z'ubuhinzi…",
    stepWrite: "Turimo gutegura igisubizo…",
    stepSlow: "Biracyakorwa, mwihangane gato…",
  },
  en: {
    title: "Farm Advisor",
    subtitle: "Ask a farming question about maize, beans or Irish potatoes.",
    placeholder: "Type your question…",
    send: "Send",
    sources: "Sources",
    newChat: "New conversation",
    tryThese: "Try one of these questions",
    error: "No answer received. Check that the backend is running, then try again.",
    crop: "Crop",
    topic: "Topic",
    time: "Time",
    you: "You",
    advisor: "Advisor",
    stepRead: "Reading your question…",
    stepSearch: "Searching farming guides…",
    stepWrite: "Writing your answer…",
    stepSlow: "Still working, please wait a little…",
  },
} satisfies Record<Language, Record<string, string>>;

export const starterQuestions: Record<Language, string[]> = {
  rw: [
    "Amababi y'ibigori byanjye afite imyobo. Ni iki kandi nakora iki?",
    "Nakoresha ifumbire ingana iki ku birayi mu murima wanjye muto?",
    "Ni ryari nkwiye kubagara ibishyimbo byanjye?",
    "Nabika nte ibigori kugira ngo bitabora cyangwa ngo bifatwe n'imungu?",
  ],
  en: [
    "My maize leaves have holes. What is it and what should I do?",
    "How much fertilizer should I use for Irish potatoes on my small plot?",
    "When should I weed my beans?",
    "How do I store maize so it does not rot or get weevils?",
  ],
};
