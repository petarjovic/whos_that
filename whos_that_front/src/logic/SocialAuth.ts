import type { FormEvent } from "react";
import { authClient } from "../lib/auth-client.ts";
import type { SocialSignInProviders } from "../lib/types.ts";

export const handleSocialSignIn = async (e: FormEvent, provider: SocialSignInProviders) => {
    e.preventDefault();
    const socialSignInResult = await authClient.signIn.social({
        provider,
        callbackURL: "http://localhost:5173/account",
        errorCallbackURL: "http://localhost:5173/error",
    });
    console.log(socialSignInResult.data);
    if (socialSignInResult.error) {
        console.error(socialSignInResult.error.message);
    } else {
        globalThis.location.assign(socialSignInResult.data.url ?? "http://localhost:5173/");
    }
};

export const handleSocialLink = async (e: FormEvent, provider: SocialSignInProviders) => {
    e.preventDefault();
    const socialLinkResult = await authClient.linkSocial({
        provider,
        callbackURL: "http://localhost:5173/account",
        errorCallbackURL: "http://localhost:5173/error",
    });
    return socialLinkResult;
};
