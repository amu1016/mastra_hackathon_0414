import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { signIn } from "../../../repositpry/firebase";
import { getStaffInfo } from "../../../repositpry/medios/staff/getStaffInfo";

export const staffLoginTool = createTool({
  id: "staff-login",
  description: "Login to Medios",
  inputSchema: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
  outputSchema: z.object({
    name: z.string(),
    hospitalName: z.string(),
    hospitalCode: z.string(),
  }),
  execute: async ({ context }) => {
    const { email, password } = context;
    const token = await login(email, password);
    const staffInfo = await getStaffInfo(token);
    return {
      name: staffInfo.staffName as string,
      hospitalName: staffInfo.hospital.name as string,
      hospitalCode: staffInfo.hospital.code as string,
    };
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
