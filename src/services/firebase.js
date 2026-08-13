import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

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

export const saveToFirebase = async (dataKey, data) => {
  try {
    const docRef = doc(db, DB_COLLECTION, DOC_ID);
    await setDoc(docRef, { [dataKey]: data }, { merge: true });
  } catch (error) {
    console.error("Firebase kaydetme hatası:", error);
  }
};

export const loadFromFirebase = async () => {
  try {
    const docRef = doc(db, DB_COLLECTION, DOC_ID);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Firebase veri çekme hatası:", error);
    return null;
  }
};

export { db };
