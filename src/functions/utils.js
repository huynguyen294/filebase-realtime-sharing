import { initFirebase } from ".";
import { get, getDatabase, onValue, push, ref, remove, set } from "firebase/database";

const sample = (d = [], fn = Math.random) => {
  if (d.length === 0) return;
  return d[Math.round(fn() * (d.length - 1))];
};

const generateUid = (limit = 16, fn = Math.random) => {
  const allowedLetters = ["abcdefghijklmnopqrstuvwxyz", "ABCDEFGHIJKLMNOPQRSTUVWXYZ"].join("");
  const allowedChars = ["0123456789", allowedLetters].join("");
  const arr = [sample(allowedLetters, fn)];
  for (let i = 0; i < limit - 1; i++) {
    arr.push(sample(allowedChars, fn));
  }

  return arr.join("");
};

const getCurrentTimeInSeconds = () => Math.floor(Date.now() / 1000);
let EXPIRE_TIME_SECONDS = 300;

const getFBUid = () => {
  const db = getDatabase(initFirebase());
  let uid = localStorage.getItem("fb-uid");
  if (!uid) {
    uid = push(ref(db)).key;
    localStorage.setItem("fb-uid", uid);
  }
  return uid;
};

const deleteById = async (id) => {
  const db = getDatabase(initFirebase());
  const newDocRef = ref(db, id);
  await remove(newDocRef);
};

export const deleteCode = async (code) => deleteById(`otps/${code}`);

export const clearUpCode = async (uid) => {
  const db = getDatabase(initFirebase());
  if (!uid) uid = localStorage.getItem("fb-uid");
  const dbRef = ref(db, `otps`);
  const snapshot = await get(dbRef);
  if (!snapshot.exists()) return;

  let found;
  const codesObj = snapshot.val();
  Object.keys(codesObj).forEach((code) => {
    const currentTime = getCurrentTimeInSeconds();
    if (codesObj[code].expireAt < currentTime) deleteById(`otps/${code}`);
    if (codesObj[code].uid === uid && codesObj[code].expireAt >= currentTime) found = { code, ...codesObj[code] };
  });

  if (!found) deleteById(uid);

  return found;
};

export const sendCode = async (onConnected, shouldCleanUp = true) => {
  const db = getDatabase(initFirebase());
  const uid = getFBUid();

  let code = generateUid(6).toUpperCase();
  let dbRef = ref(db, `otps/${code}`);

  let seconds;
  if (shouldCleanUp) {
    const oldCode = await clearUpCode(uid);
    if (oldCode) {
      code = oldCode.code;
      seconds = oldCode.expireAt - getCurrentTimeInSeconds();
      dbRef = ref(db, `otps/${oldCode.code}`);
    } else {
      await set(dbRef, { expireAt: getCurrentTimeInSeconds() + EXPIRE_TIME_SECONDS, connected: false, uid });
    }
  }

  const unsubscribe = onValue(dbRef, (snapshot) => {
    if (snapshot.exists() && snapshot.val().connected) {
      unsubscribe();
      onConnected();
      deleteById(`otps/${code}`);
    }
  });

  return { code, seconds };
};

export const sendData = async (data) => {
  const db = getDatabase(initFirebase());
  let firebaseUid = localStorage.getItem("fb-uid");
  await set(ref(db, `${firebaseUid}`), data);
};

export const verify = async (code, getData = () => {}) => {
  const db = getDatabase(initFirebase());
  const dbRef = ref(db, `otps/${code}`);
  const snapshot = await get(dbRef);
  if (snapshot.exists()) {
    const valid = snapshot.val().expireAt >= getCurrentTimeInSeconds();
    if (!valid) return false;

    const unsubscribe = onValue(ref(db, `${snapshot.val().uid}`), (dataSnapshot) => {
      if (dataSnapshot.exists()) {
        unsubscribe();
        localStorage.setItem("fb-uid", snapshot.val().uid);
        getData(dataSnapshot.val());
      }
    });

    await set(dbRef, { ...snapshot.val(), connected: true });

    return true;
  } else {
    return false;
  }
};
