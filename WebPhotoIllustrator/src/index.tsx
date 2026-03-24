import React, { createContext } from "react";

import { GoogleOAuthProvider } from "@react-oauth/google"

import ReactDOM from "react-dom/client";

import "./index.css";
import App from "./App";
import Store from "../src/Store/store"

interface IStore {
    store: Store;
}


const CLIENT_ID = "1090055509210-59gptpiisuivnakql38jfkbp96o50m1h.apps.googleusercontent.com"
const store =  new Store();
export const Context = createContext<IStore>({
  store,
});


const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <Context.Provider value={{store}}>
        <App />
      </Context.Provider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
