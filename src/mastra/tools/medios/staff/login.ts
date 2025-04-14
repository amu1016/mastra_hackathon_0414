import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { auth } from "../../../plugins/firebase.client";
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
  await signOut();
};

export const staffLoginTool = createTool({
  id: "staff-login",
  description: "Login to Medios",
  inputSchema: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
  outputSchema: z.object({}),
  execute: async ({ context }) => {
    console.log(context);
    const { email, password } = context;
    const token = await login(email, password);
    const staffInfo = await getStaffInfo(token);
    console.log(staffInfo);
    return {};
  },
});

const login = async (email: string, password: string) => {
  try {
    const res = await signIn(email, password);
    const token = res.token;
    return token;
  } catch (error) {
    console.error(error);
    throw new Error("ログインに失敗しました");
  }
};

const getStaffInfo = async (token: string) => {
  const path = `https://doctor.contrea.net/api/v2/staff/getStaffInfo`;
  const response = await fetch(path, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  return data;
};
