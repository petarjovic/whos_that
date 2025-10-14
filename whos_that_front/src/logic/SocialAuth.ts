import type { FormEvent } from "react";
import { authClient } from "../lib/auth-client.ts";
import type { SocialSignInProviders } from "../lib/types.ts";
import env from "../lib/zodEnvSchema.ts";

export const handleSocialSignIn = async (e: FormEvent, provider: SocialSignInProviders) => {
    e.preventDefault();
    const socialSignInResult = await authClient.signIn.social({
        provider,
        callbackURL: `${env.VITE_APP_URL}/account`,
        errorCallbackURL: `${env.VITE_APP_URL}error`,
    });
    if (socialSignInResult.error) {
        console.error(socialSignInResult.error.message);
    } else {
        globalThis.location.assign(socialSignInResult.data.url ?? env.VITE_APP_URL);
    }
};

export const handleSocialLink = async (e: FormEvent, provider: SocialSignInProviders) => {
    e.preventDefault();
    const socialLinkResult = await authClient.linkSocial({
        provider,
        callbackURL: `${env.VITE_APP_URL}/account`,
        errorCallbackURL: `${env.VITE_APP_URL}/error`,
    });
    return socialLinkResult;
};
