import { Button, Space, Typography } from 'antd';
import { useState } from 'react';
import { MeasureRange } from 'utils/Editor';
import TextEditor from './TextEditor';
import { ScissorOutlined } from '@ant-design/icons';

type Props = {
  range: MeasureRange | null;
  sheetKey: string;
  appendMeasureRange: () => void;
};

export default function CutMeasureInfo({ range, appendMeasureRange }: Props) {
  const [title, setTitle] = useState('');

  // TODO : Show SegmentViewer;
  return (
    <Space
      direction="vertical"
      size={10}
      style={{
        marginTop: 20,
        width: '100%',
        marginBottom: 20,
      }}
    >
      <TextEditor tag="제목" title={title} onSubmit={setTitle}></TextEditor>
      <Space direction="horizontal" size={6}>
        <Typography.Text
          style={{
            fontWeight: 'bold',
          }}
        >
          마디 |
        </Typography.Text>
        {range !== null && (
          <>
            {range.start + 1} ~ {range.end + 1} 마디
            <Button
              onClick={() => {
                //TODO:cut function
                appendMeasureRange();
              }}
            >
              <ScissorOutlined />
              자르기
            </Button>
          </>
        )}
      </Space>
    </Space>
  );
}
