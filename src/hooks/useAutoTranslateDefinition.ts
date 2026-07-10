import { useEffect, useRef, useState } from 'react';
import { translateTerm } from '../utils/translate';

const DEBOUNCE_MS = 400;

interface UseAutoTranslateDefinitionOptions {
  term: string;
  sourceLanguage: string | undefined;
  setDefinition: (value: string) => void;
}

export function useAutoTranslateDefinition({
  term,
  sourceLanguage,
  setDefinition,
}: UseAutoTranslateDefinitionOptions) {
  const [translating, setTranslating] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmedTerm = term.trim();
    if (!trimmedTerm || !sourceLanguage) {
      abortRef.current?.abort();
      abortRef.current = null;
      setTranslating(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const requestTerm = trimmedTerm;

      setTranslating(true);
      void translateTerm(requestTerm, sourceLanguage, 'English', controller.signal)
        .then((translation) => {
          if (controller.signal.aborted) return;
          if (term.trim() !== requestTerm) return;
          if (translation) {
            setDefinition(translation);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setTranslating(false);
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeout);
      abortRef.current?.abort();
      abortRef.current = null;
      setTranslating(false);
    };
  }, [term, sourceLanguage, setDefinition]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return { translating };
}
