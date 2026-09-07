"use client";

import { useEffect, useRef } from "react";

const KONAMI_CODE = [
  "arrowup",
  "arrowup",
  "arrowdown",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "arrowleft",
  "arrowright",
  "b",
  "a",
];

export function useKonamiCode(onSuccess: () => void) {
  const indexRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const callbackRef = useRef(onSuccess);

  useEffect(() => {
    callbackRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input or textarea
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      // Reset sequence after 2.5s of inactivity
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        indexRef.current = 0;
      }, 2500);

      const k = e.key.toLowerCase();
      const code = e.code.toLowerCase();
      const expected = KONAMI_CODE[indexRef.current];

      const matches =
        k === expected ||
        (expected === "arrowup" && (code === "arrowup" || k === "up")) ||
        (expected === "arrowdown" && (code === "arrowdown" || k === "down")) ||
        (expected === "arrowleft" && (code === "arrowleft" || k === "left")) ||
        (expected === "arrowright" && (code === "arrowright" || k === "right")) ||
        (expected === "b" && (code === "keyb" || k === "b")) ||
        (expected === "a" && (code === "keya" || k === "a"));

      if (matches) {
        indexRef.current += 1;
        if (indexRef.current === KONAMI_CODE.length) {
          indexRef.current = 0;
          if (timerRef.current) clearTimeout(timerRef.current);
          callbackRef.current();
        }
      } else {
        // If wrong key, check if this key could be the first in sequence
        const isStart =
          k === "arrowup" || code === "arrowup" || k === "up";
        indexRef.current = isStart ? 1 : 0;
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, []);
}
