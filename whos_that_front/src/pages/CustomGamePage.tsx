import { useNavigate } from "react-router";
import { authClient } from "../lib/auth-client";
import { useState } from "react";
import Dropzone from "../lib/Dropzone.tsx";
import type { ServerResponse } from "../lib/types.ts";
import type { CreateGameResponse } from "../../../whos_that_server/src/config/types.ts";
import { resizeImages } from "../lib/imageresizer.ts";
import { isHeic } from "heic-to";
import { heicTo } from "heic-to";

const CreateCustomGamePage = () => {
    const navigate = useNavigate();
    const acceptedImageTypes = new Set([
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/heic",
        "image/heif",
    ]);
    const maxSizeBytes = 5 * 1024 * 1024;
    const [useImageNames, setUseImageNames] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [fileNames, setFileNames] = useState<string[]>([]);
    const [isPublic, setIsPublic] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);

    const {
        data: session,
        isPending, //loading state
        error, //error object
    } = authClient.useSession(); //ERROR HANDLING

    if (isPending) return <div>Loading...</div>;
    else if (session === null || error) {
        void navigate("/");
        return <></>; // THIS RETURN STATEMENT IS A HACK TO TELL TS THAT SESSION CANNOT BE NULL
    }

    const handleRemoveImage = (index: number) => {
        setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
        setFileNames(fileNames.filter((_, i) => i !== index));
    };

    const handlePrivacyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsPublic(e.target.value === "public");
    };

    const handleUseImageFilenames = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUseImageNames(e.target.checked);
    };

    const handleClearCharacterList = () => {
        setSelectedFiles([]);
        setFileNames([]);
    };

    const handleFiles = async (files: FileList) => {
        if (files.length === 0) return;
        setIsLoading(true);
        const fileArray = [...files];
        const fileErrors: string[] = [];

        const validFilesUnfiltered = await Promise.all(
            fileArray.map(async (file) => {
                console.log(`${file.name} has type: ${file.type}`);
                if (await isHeic(file)) {
                    const blobAsJpeg = await heicTo({
                        blob: file,
                        type: "image/jpeg",
                    });
                    return new File([blobAsJpeg], file.name, {
                        type: "image/jpeg",
                        lastModified: Date.now(),
                    });
                } else if (!acceptedImageTypes.has(file.type)) {
                    fileErrors.push(`${file.name} is of an invalid file type.`);
                } else if (file.size > maxSizeBytes) {
                    fileErrors.push(`${file.name} too large.`);
                } else {
                    return file;
                }
            })
        );
        const validFiles = validFilesUnfiltered.filter((file) => file !== undefined);

        setErrors(fileErrors);

        setSelectedFiles([...selectedFiles, ...validFiles]);

        if (useImageNames)
            setFileNames([
                ...fileNames,
                ...validFiles.map((file) =>
                    file.name.replace(/\.[^./]+$/, "").replaceAll("_", " ")
                ),
            ]);
        else {
            const emptyFileNames = Array.from({ length: validFiles.length }).fill("") as string[];
            setFileNames([...fileNames, ...emptyFileNames]);
        }
        setIsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);

        if (selectedFiles.length < 6 || selectedFiles.length > 24) {
            setIsLoading(false);
            return;
        }

        const compressedFiles = await resizeImages(selectedFiles);

        const requestBody = {
            title: formData.get("title") as string,
            privacy: formData.get("privacy") as string,
            user: session.user.id,
            namesAndFileTypes: compressedFiles.map((f, i) => ({
                type: f.type,
                name: fileNames[i],
            })),
        };

        const response: Response = await fetch("http://localhost:3001/api/createNewGame", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const data = (await response.json()) as ServerResponse;
            console.error(data.message);
            return data;
        }

        const data = (await response.json()) as CreateGameResponse;

        const uploadPromises = compressedFiles.map((file, i) =>
            fileNames[i] in data
                ? fetch(data[fileNames[i]].signedUrl, {
                      method: "PUT",
                      body: file,
                      headers: {
                          "Content-Type": file.type,
                      },
                  })
                : undefined
        );
        if (uploadPromises.includes(undefined)) {
            throw new Error("Could not upload all files."); //HANDLE BETTER LATER
        }
        const uploadResponses = await Promise.all(uploadPromises);
        console.log(uploadResponses);
        setIsLoading(false);
        void navigate("/my-games");

        // await fetch("http://localhost:3001/api/finalizeGame", {
        //     method: "POST",
        //     headers: { "Content-Type": "application/json" },
        //     body: JSON.stringify({
        //         gameId: "some-id",
        //         keys: urls.map((u) => u.key),
        //     }),
        // });

        // console.log([...formData.keys()]);
        // console.log([...formData.values()]);
    };

    return (
        <form
            className="mt-9 flex h-full w-5/6 justify-between"
            encType="multipart/form-data"
            onSubmit={(e) => {
                void handleSubmit(e);
            }}
        >
            <div className="mr-10 w-[45%]">
                {/* Step 1 */}
                <div className="mb-3 mr-2 rounded-lg border-cyan-200 bg-cyan-100 p-4 shadow-lg">
                    <label
                        htmlFor="title"
                        className="m-auto block text-2xl font-medium text-gray-900"
                    >
                        <div className="mr-3 inline-block h-11 w-11 content-center rounded-[50%] bg-blue-500 text-center font-semibold text-white">
                            1
                        </div>
                        Game Title:
                    </label>
                    <input
                        type="text"
                        name="title"
                        placeholder="(E.g. American Presidents, Famous Actors)"
                        className="ml-13 inset-shadow-sm block w-5/6 rounded-lg border border-cyan-400 bg-white px-3 py-2 text-xl font-medium text-gray-900"
                        required
                        minLength={5}
                        maxLength={20}
                    ></input>
                </div>
                {/* Step 2 */}
                <div className="mb-3 mr-2 rounded-lg border-cyan-200 bg-cyan-100 p-4 shadow-lg">
                    <label className="m-auto block whitespace-pre-wrap text-2xl font-medium text-gray-900">
                        <div className="mr-3 inline-block h-11 w-11 content-center whitespace-pre-wrap rounded-[50%] bg-blue-500 text-center font-semibold text-white">
                            2
                        </div>
                        Upload Images:
                    </label>

                    <Dropzone
                        fileHandler={(files) => {
                            void handleFiles(files);
                        }}
                    />
                    {errors.length > 0 && (
                        <div className="shadow-xs max-h-23 mb-1 overflow-y-auto rounded-md border border-red-200 bg-red-50 p-2 shadow-red-50">
                            {errors.map((error, index) => (
                                <p key={index} className="text-sm text-red-600">
                                    {"Error: " + error}
                                </p>
                            ))}
                        </div>
                    )}
                    <input
                        type="checkbox"
                        id="image-names"
                        className="ml-3 h-4 w-4 cursor-pointer appearance-auto border border-cyan-200 align-text-bottom shadow transition-all checked:border-blue-600 checked:bg-blue-600 hover:shadow-md"
                        checked={useImageNames}
                        onChange={handleUseImageFilenames}
                    ></input>
                    <label htmlFor="image-names" className="align-middle text-sm">
                        {" "}
                        Use File Names as Character Names
                    </label>
                </div>
                {/* Step 4 */}
                <div className="mb-5 mr-2 flex items-center justify-between whitespace-pre-wrap rounded-lg border-cyan-200 bg-cyan-100 p-4 text-lg font-medium text-gray-900 shadow-lg">
                    <div className="block text-2xl font-medium text-gray-900">
                        <div className="mr-3 inline-block h-11 w-11 content-center rounded-[50%] bg-blue-500 text-center text-2xl font-semibold text-white">
                            4
                        </div>
                        Game Options:
                    </div>
                    <div>
                        <input
                            type="radio"
                            id="public"
                            value="public"
                            className="h-5 w-5 cursor-pointer appearance-auto border align-text-top transition-all checked:border-cyan-600 checked:bg-cyan-600"
                            name="privacy"
                            required
                            checked={isPublic}
                            onChange={handlePrivacyChange}
                        ></input>
                        <label htmlFor="public" className="mr-5 align-middle">
                            {" "}
                            Public
                        </label>
                        <input
                            type="radio"
                            id="private"
                            value="private"
                            className="h-5 w-5 cursor-pointer appearance-auto border align-text-top transition-all checked:border-cyan-600 checked:bg-cyan-600"
                            name="privacy"
                            required
                            checked={!isPublic}
                            onChange={handlePrivacyChange}
                        ></input>
                        <label htmlFor="private" className="align-middle">
                            {" "}
                            Private
                        </label>
                    </div>
                </div>
            </div>
            <div className="flex-1">
                {/* Step 3 */}
                <div className="mb-3 mr-2 rounded-lg border-cyan-200 bg-cyan-100 p-4 shadow-md">
                    <h3 className="mb-2 whitespace-pre-wrap text-2xl font-medium text-gray-900">
                        <div className="mr-3 inline-block h-11 w-11 content-center rounded-[50%] bg-blue-500 text-center font-bold text-white">
                            3
                        </div>
                        {selectedFiles.length > 0
                            ? "Character List: "
                            : "Your Characters Will Appear Here:  "}
                        <button
                            className={`border-x-1 text-shadow-xs active:shadow-2xs active:inset-shadow-md float-right mr-5 h-11 w-fit cursor-pointer rounded-md border-b-8 border-blue-500 bg-blue-400 px-2 text-xl font-semibold text-white shadow-md hover:border-blue-600 hover:bg-blue-500 active:translate-y-[1px] active:border-none ${
                                selectedFiles.length > 0 ? "" : "hidden"
                            }`}
                            disabled={isLoading}
                            type="button"
                            onClick={handleClearCharacterList}
                        >
                            Clear List
                        </button>
                    </h3>
                    <div className="max-h-137 inset-shadow-md/10 mt-3 overflow-y-auto rounded-md border border-cyan-400 bg-gray-50 shadow-sm">
                        {selectedFiles.length > 0 ? (
                            selectedFiles.map((file, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center py-2 ${
                                        index % 2 === 0 ? "bg-gray-300" : "bg-gray-100"
                                    }`}
                                >
                                    <button
                                        className="ml-5 text-lg hover:cursor-pointer hover:underline"
                                        onClick={() => {
                                            handleRemoveImage(index);
                                        }}
                                        type="button"
                                    >
                                        X
                                    </button>
                                    <div className="mx-5 text-2xl font-bold">{index + 1}</div>
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt={file.name}
                                        className="h-30 mr-6 w-20 flex-shrink-0 rounded border border-gray-300 object-cover"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <input
                                            type="text"
                                            value={fileNames[index] || ""}
                                            onChange={(e) => {
                                                const names = [...fileNames];
                                                names[index] = e.target.value;
                                                setFileNames(names);
                                            }}
                                            className="w-9/10 rounded-md border-none bg-transparent px-1 py-0.5 align-sub text-xl font-bold text-gray-700 outline-none focus:border-2 focus:border-black focus:bg-white"
                                            placeholder="(Enter character name)"
                                            required
                                        />
                                    </div>
                                </div>
                            ))
                        ) : isLoading ? (
                            <div role="status" className="my-10 ml-[50%] text-center">
                                <svg
                                    aria-hidden="true"
                                    className="h-8 w-8 animate-spin fill-blue-600 text-center text-gray-200 dark:text-gray-600"
                                    viewBox="0 0 100 101"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                        fill="currentColor"
                                    />
                                    <path
                                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                        fill="currentFill"
                                    />
                                </svg>
                            </div>
                        ) : (
                            <p className="p-10 text-sm italic text-gray-500">No images uploaded</p>
                        )}
                    </div>
                    {selectedFiles.length > 24 ? (
                        <p className="shadow-xs mt-2 rounded-md border border-red-200 bg-red-50 p-2 text-red-500 shadow-red-50">
                            You have too many characters! There is a maximum of 24.
                        </p>
                    ) : (
                        <></>
                    )}
                    {selectedFiles.length < 6 ? (
                        <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-slate-500">
                            Need at least 6 characters!
                        </p>
                    ) : (
                        <></>
                    )}
                </div>
                <button
                    className={`w-42 h-17 border-b-9 border-x-1 text-shadow-xs active:shadow-2xs active:inset-shadow-md float-right mb-2 mr-5 cursor-pointer rounded-md px-2 text-2xl font-bold text-white shadow-md active:translate-y-[1px] active:border-none ${isLoading ? "border-gray-800 bg-gray-700" : "border-blue-600 bg-blue-500 hover:border-blue-700 hover:bg-blue-600"}`}
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading ? "Loading..." : "Save Game"}
                </button>
            </div>
        </form>
    );
};
export default CreateCustomGamePage;
