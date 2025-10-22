import type { AuthData } from "./auth/auth-client";
import { useOutletContext } from "react-router";

export function useBetterAuthSession() {
    return useOutletContext<AuthData>();
}
