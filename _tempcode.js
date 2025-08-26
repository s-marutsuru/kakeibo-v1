// ログイン処理
function login() {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider)
    .then((result) => {
      const user = result.user;
      console.log("ログイン成功:", user.email);

      // 許可ユーザーのチェック
      const allowedUsers = [
        "example1@gmail.com",
        "example2@gmail.com"
      ];

      if (!allowedUsers.includes(user.email)) {
        console.warn("許可されていないユーザーです:", user.email);
        // 許可外なら即ログアウト
        firebase.auth().signOut().then(() => {
          alert("このアカウントでは利用できません。別のGoogleアカウントでログインしてください。");
          window.location.reload();
        });
      }
    })
    .catch((error) => {
      console.error("ログインエラー:", error);
    });
}

// ページ読み込み時にログイン確認
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    console.log("ログイン中:", user.email);
    // 許可チェック
    const allowedUsers = [
      "example1@gmail.com",
      "example2@gmail.com"
    ];
    if (!allowedUsers.includes(user.email)) {
      console.warn("許可されていないユーザーです:", user.email);
      firebase.auth().signOut().then(() => {
        alert("このアカウントでは利用できません。別のGoogleアカウントでログインしてください。");
        window.location.reload();
      });
    }
  } else {
    console.log("未ログイン、ログイン処理開始");
    login();
  }
});



import { getAuth, signOut } from "firebase/auth";

const auth = getAuth();

export function clearLogin() {
  signOut(auth)
    .then(() => {
      console.log("ログアウトしました。再ログイン可能です。");
      // 必要ならリロード
      window.location.reload();
    })
    .catch((error) => {
      console.error("ログアウトエラー:", error);
    });
}



