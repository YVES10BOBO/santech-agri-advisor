// Small set of Material-style icons (24x24), so the interface does not depend on emojis,
// which look different on every phone and computer.
const PATHS = {
  type: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25ZM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z",
  mic: "M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z",
  camera: "M9 3 7.2 5H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.2L15 3H9Zm3 5a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
  phone: "M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.32.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2Z",
  leaf: "M6.05 8.05a7 7 0 0 0-.02 9.88c1.47-3.4 4.09-6.24 7.36-7.93a15.95 15.95 0 0 0-4.99 9.94c2.6 1.23 5.8.78 7.95-1.37C19.83 15.09 20 4 20 4S8.91 4.17 6.05 8.05Z",
  chat: "M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2Zm2 4v2h12V8H6Zm0 4v2h8v-2H6Z",
  farm: "M12 3 2 11h3v9h6v-6h2v6h6v-9h3L12 3Z",
  badge: "M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13c-2-.7-3.7-2.1-4.8-3.9C8.4 15 10.2 14.5 12 14.5s3.6.5 4.8 1.6C15.7 17.9 14 19.3 12 20Z",
  chart: "M4 19h16v2H2V3h2v16Zm3-2V10h3v7H7Zm5 0V6h3v11h-3Zm5 0v-4h3v4h-3Z",
  flag: "M5 3h2v18H5V3Zm3 1h11l-2.5 4L19 12H8V4Z",
  book: "M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm0 2v16h12V4h-2v7l-2.5-1.5L11 11V4H6Z",
  note: "M5 3h10l4 4v14H5V3Zm9 1.5V8h3.5L14 4.5ZM8 12v2h8v-2H8Zm0 4v2h6v-2H8Z",
} as const;

export type IconName = keyof typeof PATHS;

export default function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className="icon">
      <path fill="currentColor" d={PATHS[name]} />
    </svg>
  );
}
