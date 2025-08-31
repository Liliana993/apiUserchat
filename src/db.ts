import * as admin from 'firebase-admin';
import * as serviceAccount from '../key.json';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as any),
  databaseURL: "https://apx-base-168e8-default-rtdb.firebaseio.com"
});


const db = admin.firestore();
const rtdb = admin.database();

export{
  db,
  rtdb
};