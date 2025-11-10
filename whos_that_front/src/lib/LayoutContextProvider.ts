import type { AuthData } from "./auth/auth-client";
import { useOutletContext } from "react-router";

//Custom hook to get auth/session data throughout frontend
export function useBetterAuthSession() {
    return useOutletContext<AuthData>();
}
