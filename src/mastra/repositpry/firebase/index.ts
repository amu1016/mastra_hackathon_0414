import { auth } from "../../plugins/firebase.client";
import { signInWithEmailAndPassword } from "firebase/auth";

export const signIn = async (email: string, password: string) => {
  const res = await signInWithEmailAndPassword(auth, email, password);
  const token = await res.user?.getIdToken();
  if (!token) {
    throw new Error("ログインに失敗しました");
  }
  return {
    token,
  };
};

export const signOut = async () => {
  await auth.signOut();
};
