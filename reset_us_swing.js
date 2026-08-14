import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBULa9HEB1HtcHBwANNlHXDp8Q-MhzclLs",
  authDomain: "ozialgotrade.firebaseapp.com",
  projectId: "ozialgotrade",
  storageBucket: "ozialgotrade.firebasestorage.app",
  messagingSenderId: "702905208653",
  appId: "1:702905208653:web:985f82bf69ebc5a840f104"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DB_COLLECTION = "user_data";
const DOC_ID = "ozi_algo_main";

async function resetUSSwing() {
  try {
    const docRef = doc(db, DB_COLLECTION, DOC_ID);
    await setDoc(docRef, { pastUsSwingTrades: [], activeUsSwingTrades: [] }, { merge: true });
    console.log("ABD Swing Trade geçmiş ve aktif işlemleri Firebase'de başarıyla sıfırlandı!");
    process.exit(0);
  } catch (error) {
    console.error("Firebase güncellenirken hata oluştu:", error);
    process.exit(1);
  }
}

resetUSSwing();
