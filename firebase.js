import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getAnalytics,
  isSupported,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA2Yq7uVpNzrjdl0GVM9bU6gZTaNWw55CI",
  authDomain: "imam-trading.firebaseapp.com",
  projectId: "imam-trading",
  storageBucket: "imam-trading.firebasestorage.app",
  messagingSenderId: "1015907816878",
  appId: "1:1015907816878:web:262a72d46b0cb6e513243f",
  measurementId: "G-RTPXZ76DZM",
  databaseURL:
    "https://imam-trading-default-rtdb.asia-southeast1.firebasedatabase.app",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);

if (await isSupported()) {
  getAnalytics(app);
}
