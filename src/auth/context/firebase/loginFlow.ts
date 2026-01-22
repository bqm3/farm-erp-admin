import { signInWithCustomToken } from "firebase/auth";
import { fetchFirebaseToken } from "src/api/firebase";
import { fbAuth } from "src/firebase/firebaseClient";

export async function afterJwtLoginConnectFirebase(jwt: string) {
  const { firebaseToken } = await fetchFirebaseToken();
  await signInWithCustomToken(fbAuth, firebaseToken);
}
