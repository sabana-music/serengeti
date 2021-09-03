import { DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { MdUndo, MdRedo } from 'react-icons/md';
import { Button, Card, Empty, message, Space, Tooltip, Typography } from 'antd';
import ResponsiveCont from 'components/ResponsiveCont';
import { Size } from 'constants/layout';
import { LoadRes, useEditor } from 'hooks/useEditor';
import { ContentType, WorksheetElem } from 'models/Worksheet';
import { index } from 'utils/List';
import Horizontal from 'components/Horizontal';
import ParagraphElementEditor from 'components/ParagraphElementEditor';
import { useEffect, useState } from 'react';
import { useControlKeys } from 'hooks/useControlKeys';
import ImageElementEditor from 'components/ImageElementEditor';
import TextEditor from 'components/TextEditor';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useHistory } from 'react-router-dom';
import { IoRefreshOutline } from 'react-icons/io5';
import SheetElementEditor from 'components/SheetElementEditor';
import { getAuth, User } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import SpinLayout from 'components/SpinLayout';
import { signIn } from 'utils/Auth';

const hMargin = Size.hMargin;

const grid = 4;

const getItemStyle = (isDragging: boolean, draggableStyle: any) => ({
  userSelect: 'none',
  padding: grid * 2,
  margin: `0 0 ${grid}px 0`,
  background: isDragging ? '#ffffff88' : 'transparent',
  ...draggableStyle,
});

const getListStyle = (isDraggingOver: boolean) => ({
  background: isDraggingOver ? '#e6f7ff88' : 'transparent',
  padding: grid,
  width: '100%',
});

export default function EditorRoute() {
  const { currentState, addElem, deleteElem, title, setTitle, arrangeElem } =
    useEditor();

  const [user, loading]: [User | null, boolean, any] = useAuthState(getAuth());

  if (loading) return <SpinLayout></SpinLayout>;

  if (user === null) {
    return (
      <ResponsiveCont>
        <Space
          direction="vertical"
          size={8}
          style={{
            marginTop: hMargin,
          }}
        >
          <Typography.Text>로그인이 필요합니다.</Typography.Text>
          <Button
            onClick={() => {
              signIn();
            }}
          >
            구글 로그인
          </Button>
        </Space>
      </ResponsiveCont>
    );
  }

  return (
    <ResponsiveCont>
      <Space
        direction="vertical"
        size={10}
        style={{
          marginTop: hMargin,
          width: '100%',
          marginBottom: 100,
        }}
      >
        <Header></Header>
        <TextEditor tag="제목" title={title} onSubmit={setTitle}></TextEditor>
        {currentState === null || currentState.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <DragDropContext
            onDragEnd={(result) => {
              if (!result.destination) {
                return;
              }
              console.log(result);
              arrangeElem(result.source.index, result.destination.index);
            }}
          >
            <Droppable droppableId="droppable">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  style={getListStyle(snapshot.isDraggingOver)}
                >
                  {index(currentState).map((item, index) => (
                    <Draggable
                      key={item.key}
                      draggableId={item.key.toString()}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={getItemStyle(
                            snapshot.isDragging,
                            provided.draggableProps.style,
                          )}
                        >
                          <Card
                            style={{
                              width: '100%',
                            }}
                            extra={
                              <Button
                                type="text"
                                shape="circle"
                                onClick={() => {
                                  deleteElem(item.key);
                                }}
                              >
                                <DeleteOutlined></DeleteOutlined>
                              </Button>
                            }
                            title={
                              <Typography.Text>
                                {contentTypeName(item.content.type)}
                              </Typography.Text>
                            }
                          >
                            <WorksheetElementEditor
                              elem={item.content}
                              elemInd={item.key}
                            ></WorksheetElementEditor>
                          </Card>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
        <Space direction="horizontal" size={10}>
          <Button
            onClick={() => {
              addElem(ContentType.Paragraph);
            }}
          >
            <PlusOutlined></PlusOutlined> 글 영역 추가
          </Button>
          <Button
            onClick={() => {
              addElem(ContentType.Sheet);
            }}
          >
            <PlusOutlined></PlusOutlined> 악보 추가
          </Button>
          <Button
            onClick={() => {
              addElem(ContentType.Image);
            }}
          >
            <PlusOutlined></PlusOutlined> 이미지 추가
          </Button>
        </Space>
      </Space>
    </ResponsiveCont>
  );
}

function Header() {
  const {
    currentState,
    undo,
    redo,
    undoable,
    redoable,
    loadEditor,
    saveEditor,
  } = useEditor();
  const { ctrlS, ctrlZ, ctrlY } = useControlKeys();
  const history = useHistory();

  const [saved, setSaved] = useState(true);
  const save = async () => {
    if (!saved && currentState !== null) {
      if (await saveEditor()) {
        message.success('저장되었습니다.');
        setSaved(true);
      } else {
        message.error('저장 실패');
      }
    }
  };

  useEffect(() => {
    setSaved(false);
  }, [currentState]);

  useEffect(() => {
    const res = loadEditor();
    switch (res) {
      case LoadRes.Success:
        message.success('로드 성공');
        break;
      case LoadRes.Error:
        message.error('로드 실패');
        break;
    }
    setSaved(true);
    //eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (ctrlS) {
      save();
    }
    //eslint-disable-next-line
  }, [ctrlS]);

  useEffect(() => {
    if (ctrlZ) {
      undoWithMessage();
    }
    //eslint-disable-next-line
  }, [ctrlZ]);

  useEffect(() => {
    if (ctrlY) {
      redoWithMessage();
    }
    //eslint-disable-next-line
  }, [ctrlY]);

  const undoWithMessage = () => {
    if (undoable) {
      undo();
      message.info('실행 취소');
    }
  };

  const redoWithMessage = () => {
    if (redoable) {
      redo();
      message.info('실행 취소 되돌리기');
    }
  };

  return (
    <Horizontal>
      <Typography.Text
        style={{
          fontWeight: 'bold',
          fontSize: 16,
        }}
      >
        Worksheet Editor
      </Typography.Text>
      <Space direction="horizontal" size={8}>
        <Tooltip title="Undo (ctrl + z)">
          <Button
            disabled={!undoable}
            shape="circle"
            type="text"
            onClick={() => {
              undoWithMessage();
            }}
          >
            <MdUndo></MdUndo>
          </Button>
        </Tooltip>
        <Tooltip title="Redo (ctrl + y)">
          <Button
            disabled={!redoable}
            shape="circle"
            type="text"
            onClick={() => {
              redoWithMessage();
            }}
          >
            <MdRedo></MdRedo>
          </Button>
        </Tooltip>
        <Tooltip title="Save (ctrl + s)">
          <Button
            disabled={saved === true}
            shape="circle"
            type="text"
            onClick={() => {
              save();
            }}
          >
            <SaveOutlined></SaveOutlined>
          </Button>
        </Tooltip>
        <Tooltip title="Refresh (ctrl + shfit + r)">
          <Button
            shape="circle"
            type="text"
            onClick={() => {
              history.go(0);
            }}
          >
            <IoRefreshOutline></IoRefreshOutline>
          </Button>
        </Tooltip>
      </Space>
    </Horizontal>
  );
}

function contentTypeName(contentType: ContentType): string {
  switch (contentType) {
    case ContentType.Paragraph:
      return '글 영역';
    case ContentType.Sheet:
      return '악보';
    case ContentType.Image:
      return '이미지';
    default:
      return '';
  }
}

type WorksheetElementEditorProps = {
  elem: WorksheetElem;
  elemInd: number;
};
function WorksheetElementEditor({
  elem,
  elemInd,
}: WorksheetElementEditorProps) {
  switch (elem.type) {
    case ContentType.Paragraph:
      return (
        <ParagraphElementEditor
          elem={elem}
          elemInd={elemInd}
        ></ParagraphElementEditor>
      );
    case ContentType.Sheet:
      return (
        <SheetElementEditor elem={elem} elemInd={elemInd}></SheetElementEditor>
      );
    case ContentType.Image:
      return (
        <ImageElementEditor elem={elem} elemInd={elemInd}></ImageElementEditor>
      );
  }
}
