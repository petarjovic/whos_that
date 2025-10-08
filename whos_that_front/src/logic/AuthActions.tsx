import type { FormEvent } from "react";
import { authClient } from "../lib/auth-client.ts";
import type { SocialSignInProviders } from "../lib/types.ts";

export const signUp = async (username: string, email: string, password: string) => {
    //ERROR HANDLING
    const signUpResult = await authClient.signUp.email({
        email: email,
        password: password,
        username: username,
        name: "",
        callbackURL: "http://localhost:5173/",
        // }, {
        //     onRequest: (ctx) => {
        //         //show loading
        //     },
        //     onSuccess: (ctx) => {
        //         //redirect to the dashboard or sign in page
        //     },
        //     onError: (ctx) => {
        //         // display the error message
        //         alert(ctx.error.message);
        //     },
    });
    console.log(signUpResult);
    return signUpResult;
};

export const logIn = async (username: string, password: string) => {
    //ERROR HANDLING
    const logInResult = await authClient.signIn.username({
        username: username,
        password: password,
        callbackURL: "http://localhost:5173/",
    });
    console.log(logInResult);
    return logInResult;
};

export const logOut = async () => {
    //ERROR HANDLING
    const logOutResult = await authClient.signOut();
    console.log(logOutResult);
    return logOutResult;
};

const signInSocial = async (provider: SocialSignInProviders) => {
    //ERROR HANDLING
    const socialSignInResult = await authClient.signIn.social({
        provider,
        callbackURL: "http://localhost:5173/account",
    });
    return socialSignInResult;
};

export const handleSocialSignIn = async (e: FormEvent, provider: SocialSignInProviders) => {
    //CONVERGE WITH SIGNUP PAGE SAME FUNCTION
    //ERROR HANDLING
    e.preventDefault();
    const socialSignInResult = await signInSocial(provider);
    console.log(socialSignInResult.data);
    if (socialSignInResult.error) {
        console.error(socialSignInResult.error.message); //HANDLE BETTER
    } else {
        globalThis.location.assign(socialSignInResult.data.url ?? "http://localhost:5173/"); //FIIX LATER
    }
};
