import type { ActionFunctionArgs } from "react-router";

interface ServerUploadResponse {
    success: boolean;
    fileId: string;
    url: string;
}
interface ServerErrorResponse {
    message: string;
}

export async function uploadImageAction({ request }: ActionFunctionArgs) {
    const formData = await request.formData();
    const file = formData.get("image-upload");

    console.log("Trying to upload.");

    //check if these checks are needed!
    if (!(file instanceof File)) {
        console.log(file);
        console.log("No file selected");
        return { error: "No file selected" };
    }

    if (file.size === 0) {
        console.log("File is empty");
        return { error: "File is empty" };
    }

    if (!file.type.startsWith("image/")) {
        console.log("Please upload an image file");
        return { error: "Please upload an image file" };
    }

    if (file.size > 5 * 1024 * 1024) {
        // 5MB
        console.log("File too large (max 5MB)");
        return { error: "File too large (max 5MB)" };
    }

    console.log("Ok I'm doing it for real now.");

    try {
        const response: Response = await fetch("http://localhost:3001/api/uploadImage", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const errorData = (await response.json()) as ServerErrorResponse;
            return { error: errorData.message || "Upload failed" };
        }

        const result = (await response.json()) as ServerUploadResponse;
        console.log(result);
        return result;
    } catch (error) {
        console.error("Upload error:", error);
        return error;
    }
}
