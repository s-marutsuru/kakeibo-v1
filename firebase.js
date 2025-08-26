
// ※試しに追加してみる。addDocメソッドが見えていないため
//import { getFirestore, collection, addDoc, query, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// firebase.js (signInWithPopup 版)
const firebaseConfig = {
  apiKey: "AIzaSyB6OpwxVoJjLabrdcG_2yZUW3Yb4RyP8xI",
  authDomain: "kakeibo-maru.firebaseapp.com",
  projectId: "kakeibo-maru",
  storageBucket: "kakeibo-maru.firebasestorage.app",
  messagingSenderId: "910190806845",
  appId: "1:910190806845:web:175234ec18255a57796754",
  measurementId: "G-7MYEPFZ610"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();

async function signInPopupPreferred() {
  try {
    const result = await auth.signInWithPopup(provider);
    return result.user;
  } catch (e) {
    const fallbackCodes = new Set([
      'auth/operation-not-supported-in-this-environment',
      'auth/popup-blocked',
    ]);
    if (fallbackCodes.has(e.code)) {
      // 必要な場合のみフォールバック
      await auth.signInWithRedirect(provider);
      return null;
    }
    // debug firestore authenticationで許可されてないユーザの場合におかしくなる
    // -> Googleを強制的にログオフさせる。
  const confirmLogout = confirm("許可されていないアカウントです。Googleからログオフしますか？");
  if (confirmLogout) {
      // Googleアカウントのログアウト
      window.location.href = "https://accounts.google.com/Logout";
  }

  throw e;
  }
}

async function ensureSignedIn() {
  return new Promise((resolve) => {
    auth.onAuthStateChanged((user) => resolve(user));
  });
}

auth.getRedirectResult().catch(()=>{});

window.FirebaseCtx = { auth, db, provider, ensureSignedIn, signInPopupPreferred };



