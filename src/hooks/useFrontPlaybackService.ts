import { useMemo } from 'react';
import { FrontPlaybackService } from 'services/FrontPlaybackService';
import { useAudioContext } from './useAudioContext';
import { useDispatch, useSelector } from 'react-redux';
import { State } from 'modules/State';
import { Sheet } from 'models/Sheet';
import {
  IPlaybackService,
  PlaybackServiceType,
  PlaybackState,
} from 'services/IPlaybackService';
import {
  setCurrentMeasureInd,
  setMetronomeState,
  setPlaybackService,
  setPlaybackState,
} from 'modules/audio';
import { IAudioContext } from 'standardized-audio-context';

type FrontPlaybackServiceRes = {
  playbackService: IPlaybackService | null;
  isReady: boolean;
  getOrCreateFrontPlaybackServiceWithGesture: () => Promise<FrontPlaybackService | null>;
};

export function useFrontPlaybackService(
  sheetKey: string,
): FrontPlaybackServiceRes {
  const { getOrCreateAudioContextWithGesture } = useAudioContext();
  const sheet: Sheet | null = useSelector(
    (state: State) => state.audio.sheets[sheetKey] ?? null,
  );
  const playbackService = useMemo(
    () => (sheet !== null ? sheet.playbackService : null),
    [sheet],
  );
  const serviceType = useMemo(
    () => (sheet !== null ? sheet.playbackServiceType : null),
    [sheet],
  );

  const isReady = useMemo(() => {
    return (
      playbackService !== null &&
      serviceType === PlaybackServiceType.FrontService
    );
  }, [playbackService, serviceType]);

  const dispatch = useDispatch();

  const create = async (
    audioContext: IAudioContext,
  ): Promise<FrontPlaybackService> => {
    if (playbackService !== null) {
      playbackService.stop();
    }

    const service = new FrontPlaybackService();
    await service.init(sheet.osmd, audioContext);

    dispatch(
      setPlaybackService(sheetKey, service, PlaybackServiceType.FrontService),
    );
    dispatch(setPlaybackState(sheetKey, PlaybackState.INIT));
    service.addPlaybackStateListener((state) => {
      dispatch(setPlaybackState(sheetKey, state));
    });
    service.addIteratorListener((iterator) => {
      dispatch(setCurrentMeasureInd(sheetKey, iterator.CurrentMeasureIndex));
    });
    service.addMetronomeListener((metronomeState) => {
      dispatch(setMetronomeState(sheetKey, metronomeState));
    });

    return service;
  };

  const getOrCreateFrontPlaybackServiceWithGesture =
    async (): Promise<FrontPlaybackService | null> => {
      if (isReady) {
        return playbackService as FrontPlaybackService;
      }

      const ac = await getOrCreateAudioContextWithGesture();
      return await create(ac);
    };

  return {
    playbackService,
    isReady,
    getOrCreateFrontPlaybackServiceWithGesture,
  };
}
