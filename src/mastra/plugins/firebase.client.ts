import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const config = (env: "prod" | "dev" = "dev") => {
  // 本番環境のMediOSへアクセスする場合に使用
  if (env === "prod") {
    return {
      apiKey: "AIzaSyC55Qi7T5f1d1aW1C6BzyPqGDYysjlrZVA",
      authDomain: "contrea-6e19a.firebaseapp.com",
      databaseURL: "https://contrea-6e19a.firebaseio.com",
      projectId: "contrea-6e19a",
      storageBucket: "contrea-6e19a.appspot.com",
      messagingSenderId: "985546591679",
      appId: "1:985546591679:web:99ab224c4cb7f554eae50a",
      measurementId: "G-2GPZ8V1RJD",
    };
  }

  // 開発環境のMediOSへアクセスする場合に使用
  return {
    apiKey: "AIzaSyBay0IjT-qsIM8fDoLr9uvi_-OYinnU3fo",
    authDomain: "contrea-dev.firebaseapp.com",
    databaseURL: "https://contrea-dev.firebaseio.com",
    projectId: "contrea-dev",
    storageBucket: "contrea-dev.appspot.com",
    messagingSenderId: "807273632873",
    appId: "1:807273632873:web:eab1b298361a3441a7fef8",
    measurementId: "G-NQJ05LYET4",
  };
};

const app =
  getApps().length === 0 ? initializeApp(config("dev")) : getApps()[0];
export const auth = getAuth(app);
