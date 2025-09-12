import { authClient } from "../lib/auth-cleint.ts";
import { redirect } from "react-router";
export const signUp = async (username: string, email: string, password: string) => {
    const signUpResult = await authClient.signUp.email({
        email: email,
        password: password,
        username: username,
        name: "",
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
    const logInResult = await authClient.signIn.username({
        username: username,
        password: password,
        callbackURL: "http://localhost:5173/",
    });
    console.log(logInResult);
    redirect("/");
    return logInResult;
};

export const logOut = async () => {
    const logOutResult = await authClient.signOut();
    return logOutResult;
};
