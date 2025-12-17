import { useOutletContext } from "react-router";
import type { AuthData } from "./auth/auth-client";

//Get auth/session data from layout context throughout frontend
export function useBetterAuthSession(): AuthData {
    return useOutletContext<AuthData>();
}
