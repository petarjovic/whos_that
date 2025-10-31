import { createAuthClient } from "better-auth/react";
import { usernameClient, adminClient } from "better-auth/client/plugins";
import env from "../zodEnvSchema.ts";

export const authClient = createAuthClient({
    baseURL: env.VITE_SERVER_URL,
    plugins: [usernameClient(), adminClient()],
    fetchOptions: {
        credentials: "include",
    },
});

type Session = typeof authClient.$Infer.Session;
export interface AuthData {
    session: Session | null;
    isPending: boolean;
}
