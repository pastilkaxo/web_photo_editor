import React, { useContext, useEffect } from "react"

import {observer} from "mobx-react-lite"
import {
  BrowserRouter as Router,
  Routes,
  Route,
}
  from "react-router-dom";

import NotFound from "./Components/ErrorAlerts/NotFound";
import Header from "./Components/Header/Header";
import Profile from "./Components/Main/Account/AccountPage/Profile";
import PublicAuthorProfile from "./Components/Main/Account/AccountPage/PublicAuthorProfile";
import ProjectsView from "./Components/Main/Account/AccountPage/ProjectsView";
import ResetForm from "./Components/Main/AuthForm/ResetForm";
import CanvasApp from "./Components/Main/Fabric/CanvasApp";
import Main from "./Components/Main/Main";
import Storage from "./Components/Main/Storage/Storage";
import {Context} from "./index"
import "./Styles/App.css"



// import '@fontsource/inter';


function App() {

  const {store} = useContext(Context);
  useEffect(() => {
    if(localStorage.getItem("token")){
      store.checkAuth();
    }
    if(localStorage.getItem("passwordToken")){
      store.setWantToResetPass(true);
    }
    
    
  }, []);


  // if (store.isLoading) {
  //   return <p>wkfnkwf</p>
  // }


  return (
    <Router>
      <div className="wrapper d-flex min-vh-100">
        {store.isAuth && <Header/>}
        <div className="flex-grow-1">
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Main  />} />
              <Route path="/storage" element={store.isAuth ? <Storage /> : <Main />} />
              <Route path="/projects" element={store.isAuth ? <ProjectsView standalone /> : <Main />} />
              <Route path="/editor" element={<CanvasApp />} />
              <Route path="/editor/:id" element={store.isAuth ? <CanvasApp /> : <Main />} />
              <Route path="/profile/:userId" element={<PublicAuthorProfile />} />
              <Route path="/profile" element={store.isAuth ? <Profile /> : <Main />} />
              <Route path="/password/reset" element={store.wantToResetPassword && !store.isAuth ? <ResetForm /> : <NotFound />} />
              <Route path='*' element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  )
}

export default observer(App);
