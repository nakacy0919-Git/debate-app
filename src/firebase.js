import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBOetE3Q-L30vNpi3tu9oKz5dZQ3UZHQ3g",
  authDomain: "debate-battle-app-362c1.firebaseapp.com",
  projectId: "debate-battle-app-362c1",
  storageBucket: "debate-battle-app-362c1.firebasestorage.app",
  messagingSenderId: "78224494334",
  appId: "1:78224494334:web:c9523e32533497b6dd9faf"
};

// Firebaseを起動して、データベース(Firestore)を使えるようにする
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);