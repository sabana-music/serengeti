import { Space, Typography, Button, Breadcrumb } from 'antd';
import { Footer, Header } from 'antd/lib/layout/layout';
import styled from 'styled-components';
import { HomeOutlined, SettingOutlined } from '@ant-design/icons';
import React, { useMemo, useState } from 'react';
import SettingsModal from 'components/SettingsModal';
import {
  Route,
  Switch,
  useLocation,
  Link,
  Redirect,
  RouteComponentProps,
} from 'react-router-dom';
import MainRoute from 'routes/MainRoute';
import SheetRoute from 'routes/SheetRoute';
import OSMDRoute from 'routes/OSMDRoute';
import MIDIRoute from 'routes/MIDIRoute';
import PianoRollRoute from 'routes/PianoRollRoute';

const Main = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const Screen = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

const FooterCont = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
`;

const HeaderCont = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const BreadCrumbCont = styled.div`
  background-color: #f1f1f1;
  padding: 10px 50px 10px 50px;
`;

type BreadcrumbItem = {
  routeName: string;
  component:
    | React.ComponentType<RouteComponentProps<any>>
    | React.ComponentType<any>
    | undefined;
  extraIcon?: React.ReactNode;
};

type BreadCrumbMap = {
  [key: string]: BreadcrumbItem;
};

const routeMap: BreadCrumbMap = {
  '/sheet': {
    routeName: 'Sheet Music Viewer',
    component: SheetRoute,
  },
  '/osmd': {
    routeName: 'OSMD Component',
    component: OSMDRoute,
  },
  '/midi': {
    routeName: 'MIDI',
    component: MIDIRoute,
  },
  '/pianoRoll': {
    routeName: 'Piano Roll',
    component: PianoRollRoute,
  },
};

function App() {
  const [settingsModal, setSettingsModal] = useState(false);
  const location = useLocation();
  const pathSnippets = useMemo(
    () => location.pathname.split('/').filter((i) => i),
    [location],
  );
  const breadcrumbItems = useMemo(() => {
    const mainBreadcrumb: React.ReactNode[] = [
      <Breadcrumb.Item key="/">
        <Space direction="horizontal">
          <HomeOutlined />
          <Link to="/">Main</Link>
        </Space>
      </Breadcrumb.Item>,
    ];
    const extraBreadcrumbs: React.ReactNode[] = [];
    pathSnippets.forEach((_, index) => {
      const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
      if (routeMap[url] !== undefined) {
        extraBreadcrumbs.push(
          <Breadcrumb.Item key={url}>
            <Space direction="horizontal">
              {routeMap[url].extraIcon !== undefined && routeMap[url].extraIcon}
              <Link to={url}>{routeMap[url].routeName}</Link>
            </Space>
          </Breadcrumb.Item>,
        );
      }
    });
    return mainBreadcrumb.concat(extraBreadcrumbs);
  }, [pathSnippets]);

  return (
    <Screen>
      <SettingsModal
        visible={settingsModal}
        onVisibleChange={setSettingsModal}
      ></SettingsModal>
      <Header>
        <HeaderCont>
          <Space size={8}>
            <Typography.Text
              style={{
                color: 'white',
                fontWeight: 'bold',
                fontSize: 20,
              }}
            >
              Serengeti
            </Typography.Text>
            <Typography.Text
              style={{
                color: 'white',
                fontSize: 18,
              }}
            >
              | UGRP
            </Typography.Text>
          </Space>
          <Button
            shape="circle"
            onClick={() => {
              setSettingsModal(true);
            }}
          >
            <SettingOutlined />
          </Button>
        </HeaderCont>
      </Header>
      <Main>
        <BreadCrumbCont>
          <Breadcrumb separator=">">{breadcrumbItems}</Breadcrumb>
        </BreadCrumbCont>
        <Switch>
          <Route path="/" exact component={MainRoute} />
          {Object.entries(routeMap).map(([route, { component }], _) => (
            <Route path={route} exact component={component} />
          ))}
          <Redirect to="/"></Redirect>
        </Switch>
      </Main>
      <Footer>
        <FooterCont>
          <Typography.Text style={{ textAlign: 'center' }}>
            copyright. 2021. sabana-music
          </Typography.Text>
        </FooterCont>
      </Footer>
    </Screen>
  );
}

export default App;
