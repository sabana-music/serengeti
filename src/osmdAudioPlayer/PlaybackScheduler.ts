import StepQueue from './internals/StepQueue';
import { VoiceEntry } from 'opensheetmusicdisplay/build/dist/src';
import { IAudioContext } from 'standardized-audio-context';

type NoteSchedulingCallback = (
  delay: number,
  stepIndex: number,
  notes: any,
) => void;

type MetronomeCallback = (delay: number) => void;

export default class PlaybackScheduler {
  public denominator: number;
  public wholeNoteLength: number;

  private stepQueue = new StepQueue();
  private stepQueueIndex = 0;

  private currentTick = 0;
  private currentTickTimestamp = 0;

  private audioContext: IAudioContext;
  private audioContextStartTime: number = 0;

  private schedulerIntervalHandle: number | null = null;
  private scheduleInterval: number = 200; // Milliseconds
  private metronomeProcessInterval: number = 300; // Milliseconds
  private lastProcessed = 0;
  private schedulePeriod: number = 500;
  private tickDenominator: number = 1024;

  private lastTickOffset: number = 300; // Hack to get the initial notes play better
  private playing: boolean = false;
  private metronome: boolean = false;

  private noteSchedulingCallback: NoteSchedulingCallback;
  private metronomeCallback: MetronomeCallback;

  constructor(
    denominator: number,
    wholeNoteLength: number,
    audioContext: IAudioContext,
    noteSchedulingCallback: NoteSchedulingCallback,
    metronomeCallback: MetronomeCallback,
  ) {
    this.noteSchedulingCallback = noteSchedulingCallback;
    this.denominator = denominator;
    this.wholeNoteLength = wholeNoteLength;
    this.audioContext = audioContext;
    this.metronomeCallback = metronomeCallback;
  }

  get schedulePeriodTicks() {
    return this.schedulePeriod / this.tickDuration;
  }

  get audioContextTime() {
    if (!this.audioContext) return 0;
    return (this.audioContext.currentTime - this.audioContextStartTime) * 1000;
  }

  get tickDuration() {
    return this.wholeNoteLength / this.tickDenominator;
  }

  private get calculatedTick() {
    return (
      this.currentTick +
      Math.round(
        (this.audioContextTime - this.currentTickTimestamp) / this.tickDuration,
      )
    );
  }

  startMetronome() {
    this.metronome = true;
    this.startIteration();
  }

  stopMetronome() {
    this.metronome = false;
  }

  start() {
    this.stepQueue.sort();
    this.audioContextStartTime = this.audioContext.currentTime;
    this.lastProcessed = 0;
    this.currentTickTimestamp = this.audioContextTime;
    this.playing = true;
    this.startIteration();
  }

  startIteration() {
    if (!this.schedulerIntervalHandle) {
      this.schedulerIntervalHandle = window.setInterval(
        () => this.scheduleIterationStep(),
        this.scheduleInterval,
      );
    }
  }

  setIterationStep(step: number) {
    step = Math.min(this.stepQueue.steps.length - 1, step);
    this.stepQueueIndex = step;
    this.currentTick = this.stepQueue.steps[this.stepQueueIndex].tick;
  }

  getIterationStep() {
    return this.stepQueueIndex;
  }

  pause() {
    this.playing = false;
  }

  reset() {
    this.playing = false;
    this.currentTick = 0;
    this.currentTickTimestamp = 0;
    this.stepQueueIndex = 0;
    clearInterval(this.scheduleInterval);
    this.schedulerIntervalHandle = null;
  }

  loadNotes(currentVoiceEntries: VoiceEntry[]) {
    let thisTick = this.lastTickOffset;
    if (this.stepQueue.steps.length > 0) {
      thisTick = this.stepQueue.getFirstEmptyTick();
    }

    for (let entry of currentVoiceEntries) {
      if (!entry.IsGrace) {
        for (let note of entry.Notes) {
          this.stepQueue.addNote(thisTick, note);
          this.stepQueue.createStep(
            thisTick + note.Length.RealValue * this.tickDenominator,
          );
        }
      }
    }
  }

  private scheduleIterationStep() {
    if (this.metronome) {
      const thisTick = this.calculatedTick;
      const beatTick = this.tickDenominator / this.denominator;
      const offsetTick = (thisTick - this.lastTickOffset) % beatTick;
      const currentTime = this.audioContextTime;

      let curTick = beatTick - offsetTick;
      while (curTick < this.metronomeProcessInterval) {
        const curTimespan = curTick * this.tickDuration;
        const current = curTimespan + currentTime;
        if (current > this.lastProcessed + (beatTick * this.tickDuration) / 2) {
          this.metronomeCallback(curTimespan / 1000);
          this.lastProcessed = current;
        }
        curTick += beatTick;
      }
    }

    if (!this.playing) return;

    this.currentTick = this.calculatedTick;
    this.currentTickTimestamp = this.audioContextTime;

    let nextTick = this.stepQueue.steps[this.stepQueueIndex]?.tick;

    while (this.nextTickAvailableAndWithinSchedulePeriod(nextTick)) {
      let step = this.stepQueue.steps[this.stepQueueIndex];

      let timeToTick = (step.tick - this.currentTick) * this.tickDuration;
      if (timeToTick < 0) timeToTick = 0;

      this.noteSchedulingCallback(
        timeToTick / 1000,
        this.stepQueueIndex,
        step.notes,
      );

      this.stepQueueIndex++;
      nextTick = this.stepQueue.steps[this.stepQueueIndex]?.tick;
    }
  }

  private nextTickAvailableAndWithinSchedulePeriod(
    nextTick: number | undefined,
  ) {
    return (
      nextTick &&
      (nextTick - this.currentTick) * this.tickDuration <= this.schedulePeriod
    );
  }
}
