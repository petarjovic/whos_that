import type { AuthData } from "../lib/auth-client";
import { useOutletContext } from "react-router";

export function useBetterAuthSession() {
    return useOutletContext<AuthData>();
}
