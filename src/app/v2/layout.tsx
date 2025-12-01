// src/app/v2/layout.tsx
// V2 layout - wraps content but doesn't add extra Header/Footer
// The root layout already provides Header/Footer, so V2 pages 
// will use a different approach - hiding root header and showing V2 header

export const metadata = {
  title: "ZECODE V2 - Bold Design Preview",
  description: "Preview of the new bold ZECODE design",
};

export default function V2Layout({ children }: { children: React.ReactNode }) {
  // Just pass through children - don't add duplicate Header/Footer
  return <>{children}</>;
}
