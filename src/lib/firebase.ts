import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// This is a public configuration and is safe to expose.
// Security is handled by Firebase Security Rules.
const firebaseConfig = {
  apiKey: "AIzaSyCNGkOxT7f_dKfoJd3f428tNDbfzbU21OY",
  authDomain: "studio-9923645100-b578e.firebaseapp.com",
  projectId: "studio-9923645100-b578e",
  storageBucket: "studio-9923645100-b578e.appspot.com",
  messagingSenderId: "1054598258630",
  appId: "1:1054598258630:web:eab32b29eaf533a38b9cc7",
  measurementId: ""
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
