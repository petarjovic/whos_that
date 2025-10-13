import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    /** The base URL of the server (optional if you're using the same domain) */
    baseURL: "http://localhost:3001",
    plugins: [usernameClient()],
    fetchOptions: {
        credentials: "include",
    },
});

type Session = typeof authClient.$Infer.Session;
export interface AuthData {
    session: Session | null;
    isPending: boolean;
}
