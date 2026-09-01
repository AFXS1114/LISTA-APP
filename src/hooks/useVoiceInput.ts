// ─────────────────────────────────────────────
//  LISTA · Hook · useVoiceInput
//  On-device speech recognition that parses
//  field values from natural speech like:
//  "vessel name alvin no of tubs 10 specie tamban"
// ─────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

export type ParsedVesselFields = {
  vessel_name?: string;
  num_tubs?: string;
  specie?: string;
};

type Options = {
  onFieldsParsed: (fields: ParsedVesselFields) => void;
  onError?: (message: string) => void;
};

function parseVesselSpeech(transcript: string): ParsedVesselFields {
  const text = transcript.toLowerCase().trim();
  const result: ParsedVesselFields = {};

  // ── vessel name ──────────────────────────────
  const vesselMatch = text.match(
    /(?:vessel\s*(?:name)?\s*[:\-]?\s*)([a-z0-9\s]+?)(?:\s*(?:no\.?\s*of\s*tubs?|number\s*of\s*tubs?|tubs?|specie|species|$))/i
  );
  if (vesselMatch) result.vessel_name = vesselMatch[1].trim();

  // ── number of tubs ───────────────────────────
  const tubsMatch = text.match(
    /(?:no\.?\s*of\s*tubs?|number\s*of\s*tubs?|tubs?)\s*[:\-]?\s*(\d+)/i
  );
  if (tubsMatch) result.num_tubs = tubsMatch[1].trim();

  // ── specie ───────────────────────────────────
  const specieMatch = text.match(
    /(?:species?)\s*[:\-]?\s*([a-z]+(?:\s+[a-z]+)?)/i
  );
  if (specieMatch) result.specie = specieMatch[1].trim();

  return result;
}

export function useVoiceInput({ onFieldsParsed, onError }: Options) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const hasPermission = useRef(false);

  const requestPermission = useCallback(async () => {
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    hasPermission.current = result.granted;
    return result.granted;
  }, []);

  useSpeechRecognitionEvent('result', (event) => {
    if (event.results?.[0]?.transcript) {
      const text = event.results[0].transcript;
      setTranscript(text);
      const fields = parseVesselSpeech(text);
      if (Object.keys(fields).length > 0) {
        onFieldsParsed(fields);
      }
    }
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
  });

  useSpeechRecognitionEvent('error', (event) => {
    setIsListening(false);
    onError?.(`Voice error: ${event.error}`);
  });

  const startListening = useCallback(async () => {
    if (!hasPermission.current) {
      const granted = await requestPermission();
      if (!granted) {
        onError?.('Microphone permission denied');
        return;
      }
    }
    setTranscript('');
    setIsListening(true);
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: false,
    });
  }, [requestPermission, onError]);

  const stopListening = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
    setIsListening(false);
  }, []);

  useEffect(() => {
    requestPermission();
    return () => {
      ExpoSpeechRecognitionModule.abort();
    };
  }, [requestPermission]);

  return { isListening, transcript, startListening, stopListening };
}
