export enum Articulation {
  Legato,
  Staccato,
}

export type NotePlayOption = {
  midiKeyNumber: number;
  gain: number;
  duration: number;
  articulation: Articulation;
};

export interface IAudioService {
  schedule: (time: number, notes: NotePlayOption[]) => void;
  play: (note: NotePlayOption) => void;
  stop: () => void;
}
