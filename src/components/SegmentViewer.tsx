import { Button, Space, Spin, Typography } from 'antd';
import { useFrontPlaybackService } from 'hooks/useFrontPlaybackService';
import {
  loadSheetWithUrlThunk,
  stopOtherPlaybackServicesThunk,
} from 'modules/audio';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import Viewer from './Viewer';
import { IoStop, IoPlay, IoPause } from 'react-icons/io5';
import { PlaybackState } from 'osmdAudioPlayer/PlaybackEngine';
import { useSheet } from 'hooks/useSheet';
import { GiMetronome } from 'react-icons/gi';

const SheetCont = styled.div`
  width: 100%;
  overflow-x: hidden;
  overflow-y: hidden;
  background-color: white;
  padding-top: 10px;
  position: relative;
`;

type LoadingProps = {
  isLoading: boolean;
};

const Loading = styled.div<LoadingProps>`
  display: ${(props) => (props.isLoading ? 'flex' : 'none')};
  justify-content: center;
  align-items: center;
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
`;

type SegmentViewerProps = {
  sheetKey: string;
  title?: string;
  url?: string;
  oneStaff?: boolean;
};
export default function SegmentViewer({
  sheetKey,
  title,
  url,
  oneStaff,
}: SegmentViewerProps) {
  const { getOrCreateFrontPlaybackServiceWithGesture } =
    useFrontPlaybackService(sheetKey);

  const { sheet, isLoaded } = useSheet(sheetKey);

  const [isSheetLoading, setIsSheetLoading] = useState(false);
  const dispatch = useDispatch();
  useEffect(() => {
    if (url !== undefined && title !== undefined) {
      setIsSheetLoading(true);
      dispatch(loadSheetWithUrlThunk(sheetKey, title, url));
    }
  }, [url, title, dispatch, sheetKey]);

  useEffect(() => {
    if (isLoaded) {
      setIsSheetLoading(false);
    }
  }, [isLoaded]);

  const height = oneStaff ? 110 : 220;
  const viewerTitle = title ?? 'OSMD Viewer';

  const play = async () => {
    dispatch(stopOtherPlaybackServicesThunk(sheetKey));
    const service = await getOrCreateFrontPlaybackServiceWithGesture();
    service?.play();
  };

  const pause = async () => {
    const service = await getOrCreateFrontPlaybackServiceWithGesture();
    service?.pause();
  };

  const stop = async () => {
    const service = await getOrCreateFrontPlaybackServiceWithGesture();
    service?.stop();
  };

  const toggleMetronome = async () => {
    const met = sheet?.metronomeState ?? false;
    const service = await getOrCreateFrontPlaybackServiceWithGesture();

    if (met) {
      service?.stopMetronome();
    } else {
      dispatch(stopOtherPlaybackServicesThunk(sheetKey));
      service?.startMetronome();
    }
  };

  return (
    <div
      style={{
        width: '100%',
        backgroundColor: '#e1e1e1',
        paddingBottom: 20,
      }}
    >
      <div
        style={{
          paddingTop: 8,
          paddingLeft: 24,
          paddingBottom: 8,
          paddingRight: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography.Text
          style={{
            fontWeight: 'bold',
          }}
        >
          {viewerTitle}
        </Typography.Text>
        {(() => {
          if (isLoaded) {
            switch (sheet?.playbackState) {
              case null:
                return (
                  <Space direction="horizontal" size={8}>
                    <Button onClick={play} type="text" shape="circle">
                      <IoPlay />
                    </Button>
                  </Space>
                );
              case PlaybackState.INIT:
              case PlaybackState.PAUSED:
              case PlaybackState.STOPPED:
                return (
                  <Space direction="horizontal" size={8}>
                    <Button onClick={play} type="text" shape="circle">
                      <IoPlay />
                    </Button>
                    <Button onClick={stop} type="text" shape="circle">
                      <IoStop />
                    </Button>
                    <Button
                      onClick={toggleMetronome}
                      style={{
                        color:
                          sheet?.metronomeState ?? false ? 'black' : '#888888',
                      }}
                      type="text"
                      shape="circle"
                    >
                      <GiMetronome></GiMetronome>
                    </Button>
                  </Space>
                );
              case PlaybackState.PLAYING:
                return (
                  <Space direction="horizontal" size={8}>
                    <Button onClick={pause} type="text" shape="circle">
                      <IoPause />
                    </Button>
                    <Button onClick={stop} type="text" shape="circle">
                      <IoStop />
                    </Button>
                    <Button
                      onClick={toggleMetronome}
                      style={{
                        color:
                          sheet?.metronomeState ?? false ? 'black' : '#888888',
                      }}
                      type="text"
                      shape="circle"
                    >
                      <GiMetronome></GiMetronome>
                    </Button>
                  </Space>
                );
            }
          }
        })()}
      </div>
      <SheetCont>
        <div
          style={{
            minHeight: height,
          }}
        >
          <Viewer sheetKey={sheetKey}></Viewer>
        </div>
        <Loading isLoading={isSheetLoading}>
          <Spin size="large"></Spin>
        </Loading>
      </SheetCont>
    </div>
  );
}
