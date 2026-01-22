import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { FIREBASE_API } from 'src/config-global';


const app = initializeApp(FIREBASE_API);

export const fbAuth = getAuth(app);
export const db = getFirestore(app);
