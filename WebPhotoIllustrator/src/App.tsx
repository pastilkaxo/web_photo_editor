import React, { useContext, useEffect } from "react";

import { observer } from "mobx-react-lite";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
} from "react-router-dom";

import NotFound from "./Components/ErrorAlerts/NotFound";
import Header from "./Components/Header/Header";
import Profile from "./Components/Main/Account/AccountPage/Profile";
import PublicAuthorProfile from "./Components/Main/Account/AccountPage/PublicAuthorProfile";
import ProjectsView from "./Components/Main/Account/AccountPage/ProjectsView";
import ResetForm from "./Components/Main/AuthForm/ResetForm";
import CanvasApp from "./Components/Main/Fabric/CanvasApp";
import Main from "./Components/Main/Main";
import Storage from "./Components/Main/Storage/Storage";
import HallOfFame from "./Components/Main/Storage/HallOfFame";
import { Context } from "./index";
import "./Styles/App.css";

const AppShell = observer(function AppShell() {
  const { store } = useContext(Context);
  return (
    <div className="wrapper d-flex min-vh-100">
      {store.isAuth && <Header />}
      <div className="flex-grow-1">
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
});

const StorageGate = observer(function StorageGate() {
  const { store } = useContext(Context);
  return store.isAuth ? <Storage /> : <Main />;
});

const HallOfFameGate = observer(function HallOfFameGate() {
  const { store } = useContext(Context);
  return store.isAuth ? <HallOfFame /> : <Main />;
});

const ProjectsGate = observer(function ProjectsGate() {
  const { store } = useContext(Context);
  return store.isAuth ? <ProjectsView standalone /> : <Main />;
});

const EditorWithAuthGate = observer(function EditorWithAuthGate() {
  const { store } = useContext(Context);
  return store.isAuth ? <CanvasApp /> : <Main />;
});

const ProfileGate = observer(function ProfileGate() {
  const { store } = useContext(Context);
  return store.isAuth ? <Profile /> : <Main />;
});

const ResetPasswordGate = observer(function ResetPasswordGate() {
  const { store } = useContext(Context);
  return store.wantToResetPassword && !store.isAuth ? <ResetForm /> : <NotFound />;
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <Main /> },
      { path: "storage", element: <StorageGate /> },
      { path: "hall-of-fame", element: <HallOfFameGate /> },
      { path: "projects", element: <ProjectsGate /> },
      { path: "editor", element: <CanvasApp /> },
      { path: "editor/:id", element: <EditorWithAuthGate /> },
      { path: "profile/:userId", element: <PublicAuthorProfile /> },
      { path: "profile", element: <ProfileGate /> },
      { path: "password/reset", element: <ResetPasswordGate /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

function App() {
  const { store } = useContext(Context);
  useEffect(() => {
    if (localStorage.getItem("token")) {
      store.checkAuth();
    }
    if (localStorage.getItem("passwordToken")) {
      store.setWantToResetPass(true);
    }
  }, [store]);

  return <RouterProvider router={router} />;
}

export default observer(App);
