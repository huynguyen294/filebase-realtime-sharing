import { initFirebase, sendCode } from "../src/index.js";

const firebaseConfig = {
  apiKey: "AIzaSyAsbFKOwe3xf98FO6Dgaq-FwxCEUmpBYcM",
  authDomain: "filebase-realtime-share.firebaseapp.com",
  projectId: "filebase-realtime-share",
  storageBucket: "filebase-realtime-share.firebasestorage.app",
  messagingSenderId: "580332273338",
  appId: "1:580332273338:web:96fc348f30bb952c5fcc83",
  measurementId: "G-Z43R6RTDL6",
  databaseURL: "https://filebase-realtime-share-default-rtdb.asia-southeast1.firebasedatabase.app/",
};

initFirebase(firebaseConfig);
const { code, seconds } = await sendCode();
console.log(code);
