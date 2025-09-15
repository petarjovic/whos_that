import { authClient } from "../lib/auth-client.ts";

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
