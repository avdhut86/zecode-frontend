// src/app/v3/layout.tsx
// V3 layout - passes through to page which handles its own header/footer

export const metadata = {
  title: "ZECODE V3 - Parallax Experience",
  description: "Immersive parallax scrolling experience showcasing ZECODE collections",
};

export default function V3Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
