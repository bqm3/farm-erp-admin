import { collection, onSnapshot, orderBy, query, where, limit } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "./firebaseClient";

export function listenThreads(params: {
  farmId: number;
  uid: string;
  isAdmin: boolean;
  onData: (rows: any[]) => void;
}) {
    
  const base = collection(db, "dm_threads");
  console.log('base', base)
  console.log("listenThreads", params);
  const q = params.isAdmin
    ? query(base, where("farm_id","==", params.farmId), orderBy("updatedAt","desc"))

    : query(
        base,
        where("farm_id", "==", params.farmId),
        where("members", "array-contains", params.uid),
        orderBy("updatedAt", "desc"),
        limit(200)
      );

 return onSnapshot(
  q,
  (snap) => {
    params.onData(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  },
  (err) => {
    console.error("listenThreads error:", {
      code: err.code,
      message: err.message,
      params,
      isAuthenticated: !!getAuth().currentUser
    });
    
    // Check for specific error types
    if (err.code === 'failed-precondition') {
      console.error("Missing index - check Firebase console for index creation link");
    }
    
    params.onData([]);
  }
);

}

export function listenMessages(threadId: string, onData: (rows: any[]) => void) {
  const q = query(
    collection(db, "dm_threads", threadId, "messages"),
    orderBy("createdAt", "asc"),
    limit(300)
  );

  return onSnapshot(
  q,
  (snap) => {
    onData(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  },
  (err) => {
    console.error("listenMessages permission error:", err);
    onData([]);
  }
);

}
