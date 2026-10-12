import Papa from 'papaparse';
import type { Grid } from '../types';

export function parseCsvText(text: string): Grid {
  const body = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const result = Papa.parse<string[]>(body, {
    skipEmptyLines: false,
    delimitersToGuess: [',', ';', '\t', '|'],
  });
  return result.data;
}
