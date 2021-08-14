import { Articulation, IAudioService, NotePlayOption } from './IAudioService';
import * as Soundfont from 'soundfont-player';
import { AudioContext, IAudioContext } from 'standardized-audio-context';
import { Player } from 'soundfont-player';

export class FrontAudioService implements IAudioService {
  private static instMidiName = 'acoustic_grand_piano' as const;

  private static audioContext: IAudioContext | null = null;
  private player: Player | null = null;

  public static get AudioContext() {
    return this.audioContext;
  }

  public async init() {
    if (FrontAudioService.audioContext === null) {
      FrontAudioService.audioContext = new AudioContext();
    }
    this.player = await Soundfont.instrument(
      //@ts-ignore
      FrontAudioService.audioContext,
      FrontAudioService.instMidiName,
    );
    return;
  }
  public schedule(time: number, notes: NotePlayOption[]) {
    if (this.player === null) return;
    this.applyArticulation(notes);
    this.player.schedule(
      time,
      notes.map((note) => ({
        note: note.midiKeyNumber,
        gain: note.gain,
        duration: note.duration,
      })),
    );
  }
  public play(note: NotePlayOption) {
    this.applyArticulation([note]);
    if (this.player !== null) {
      this.player.play(
        //@ts-ignore
        note.midiKeyNumber,
        undefined,
        {
          gain: note.gain,
          duration: note.duration,
        },
      );
    }
  }
  public stop() {
    if (this.player !== null) {
      this.player.stop();
    }
  }

  private applyArticulation(notes: NotePlayOption[]): void {
    for (const note of notes) {
      if (note.articulation === Articulation.Staccato) {
        note.gain = Math.max(note.gain + 0.3, note.gain * 1.3);
        note.duration = Math.min(note.duration * 0.4, 0.4);
      }
    }
  }
}
