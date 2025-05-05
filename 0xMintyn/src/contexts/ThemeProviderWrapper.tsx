"use client";
// This makes it a client component

import { ThemeProvider } from "./ThemeContext";

export default function ThemeProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
