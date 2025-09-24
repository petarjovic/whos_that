import type { ActionFunctionArgs } from "react-router";
import type { ServerResponse } from "../lib/types.ts"; //FIX this maybe seems like a weird way to handle types
import { redirect } from "react-router";

export async function createNewGameAction({ request }: ActionFunctionArgs) {
    const formData = await request.formData();

    //ADD SOME VALIDATION HERE PERHAPS

    console.log("Ok I'm doing it for real now.");

    const response: Response = await fetch("http://localhost:3001/api/createNewGame", {
        method: "POST",
        body: formData,
    });

    const data = (await response.json()) as ServerResponse;

    if (!response.ok) {
        console.error(data.message);
        return data;
    }

    console.log(data.message);
    return redirect("/");
}
