# 家計簿PWA（Firebase + Firestore）— signInWithPopup 版

## セットアップ
1. Firebaseプロジェクト作成 → Webアプリ追加 → `firebaseConfig` を `firebase.js` に貼付。
2. Authentication → サインイン方法 → Google を有効化。
3. Authentication → 設定 → **承認済みドメイン**に配信ドメイン（`localhost`, `*.web.app`, 独自ドメイン等）を追加。
4. Firestoreを作成（本番モード推奨）。
5. `npx serve` などでローカル動作確認し、iPhone Safariからアクセス。

## 重要（iPhone PWA）
- まず **signInWithPopup** を使います（ボタンのクリックイベントから呼ばれるためポップアップ許可の前提）。
- もし環境がポップアップ非対応/ブロックされた場合は、**自動で signInWithRedirect にフォールバック**します。
  - それでもダメな場合は、PWA（ホーム画面）ではなく **Safariブラウザで直接URLを開いて**初回ログインしてください。以後はPWAでもセッションが維持されることがあります。

## Firestore ルール例（所有者のみアクセス）
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /expenses/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.ownerUid;
      allow create: if request.auth != null && request.resource.data.ownerUid == request.auth.uid;
    }
  }
}
```

