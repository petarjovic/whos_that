import type { ActionFunctionArgs } from "react-router";
import type { ServerResponse } from "../lib/types.ts"; //FIX this maybe seems like a weird way to handle types
import type { CreateGameResponse } from "../../../whos_that_server/src/config/types.ts";
import { redirect } from "react-router";

export async function createNewGameAction({ request }: ActionFunctionArgs) {
    const formData = await request.formData();

    //ADD SOME VALIDATION HERE PERHAPS

    console.log("Ok I'm doing it for real now.");

    const response: Response = await fetch("http://localhost:3001/api/createNewGame", {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const data = (await response.json()) as ServerResponse;
        console.error(data.message);
        return data;
    }

    const data = (await response.json()) as CreateGameResponse;

    console.log(data.message);
    return redirect("/");
}
