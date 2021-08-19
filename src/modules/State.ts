import { Sheet } from 'models/Sheet';
import { IAudioContext } from 'standardized-audio-context';
import { Note } from 'utils/Note';

export type CounterState = {
  count: number;
};

export type AudioState = {
  sheets: {
    [key: string]: Sheet;
  };
  audioContext: IAudioContext | null;
};

export type PianoState = {
  visibility: boolean;
  min: Note;
  max: Note;
};

export type State = {
  counter: CounterState;
  audio: AudioState;
  piano: PianoState;
};
