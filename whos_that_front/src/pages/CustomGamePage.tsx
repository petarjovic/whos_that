import { useNavigate } from "react-router";
import { useBetterAuthSession } from "../layouts/LayoutContextProvider.ts";
import { useState, useEffect } from "react";
import Dropzone from "../lib/Dropzone.tsx";
import { serverResponseSchema, acceptedImageTypesSchema } from "../lib/zodSchema.ts";
import { createGameResponseSchema } from "../../../whos_that_server/src/config/zod/zodSchema.ts";
import { resizeImages } from "../lib/imageresizer.ts";
import { isHeic } from "heic-to";
import { heicTo } from "heic-to";
import LoadingSpinner from "../lib/LoadingSpinner.tsx";

const CreateCustomGamePage = () => {
    const navigate = useNavigate();
    const maxSizeBytes = 5 * 1024 * 1024;
    const [useImageNames, setUseImageNames] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [fileNames, setFileNames] = useState<string[]>([]);
    const [isPublic, setIsPublic] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [imageErrors, setImageErrors] = useState<string[]>([]);
    const [errorMsg, setErrorMsg] = useState("");
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const { session, isPending } = useBetterAuthSession();

    //UseEffect is used to track URLs created for image preview to allow for cleanup
    useEffect(() => {
        const urls = selectedFiles.map((file) => URL.createObjectURL(file));
        setImageUrls(urls);

        return () => {
            urls.forEach((url) => {
                URL.revokeObjectURL(url);
            });
        };
    }, [selectedFiles]);

    if (isPending) return <div>Loading...</div>;
    else if (session === null) {
        void navigate("/");
        return <></>; //This return tells linter session != null
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
        const imageErrorsTemp: string[] = [];
        const validFiles: File[] = [];

        const validFilePromises = await Promise.allSettled(
            fileArray.map(async (file) => {
                console.log(`${file.name} has type: ${file.type}`);
                try {
                    if (await isHeic(file)) {
                        const blobAsJpeg = await heicTo({
                            blob: file,
                            type: "image/jpeg",
                        });
                        return new File([blobAsJpeg], file.name, {
                            type: "image/jpeg",
                            lastModified: Date.now(),
                        });
                    } else if (file.size > maxSizeBytes) {
                        throw new Error(`${file.name} too large`);
                    } else if (!acceptedImageTypesSchema.safeParse(file.type).success) {
                        throw new Error(`${file.name} is of an invalid file type.`);
                    } else {
                        return file;
                    }
                } catch (error) {
                    console.log("Error with HEIC conversion.", error);
                    throw new Error(`${file.name} had error with HEIC conversion.`);
                }
            })
        );

        for (const result of validFilePromises) {
            if (result.status === "fulfilled") {
                validFiles.push(result.value);
            } else {
                if (result.reason instanceof Error) imageErrorsTemp.push(result.reason.message);
                else imageErrorsTemp.push("File had unkown error."); //This never happens
            }
        }

        setImageErrors(imageErrorsTemp);

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
            namesAndFileTypes: compressedFiles.map((f, i) => ({
                type: f.type,
                name: fileNames[i],
            })),
        };

        let response;

        try {
            response = await fetch("http://localhost:3001/api/createNewGame", {
                method: "POST",
                body: JSON.stringify(requestBody),
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
            });
        } catch (error) {
            console.error(error);
            if (error instanceof Error) setErrorMsg(error.message);
            else setErrorMsg("Fetch request to server failed.");
            return;
        }

        if (!response.ok) {
            const validateServerRes = serverResponseSchema.safeParse(await response.json());
            const msg = validateServerRes.success
                ? validateServerRes.data.message
                : "Game creation failed.";
            setErrorMsg(msg);
            return;
        }

        const validateCreateGameRes = createGameResponseSchema.safeParse(await response.json());

        if (validateCreateGameRes.success) {
            const createGameResData = validateCreateGameRes.data;
            const uploadPromises = compressedFiles.map((file, i) =>
                fileNames[i] in createGameResData.gameItems
                    ? fetch(createGameResData.gameItems[fileNames[i]].signedUrl, {
                          method: "PUT",
                          body: file,
                          headers: {
                              "Content-Type": file.type,
                          },
                      })
                    : undefined
            );
            if (uploadPromises.includes(undefined)) {
                setErrorMsg(
                    "Server did not send enough S3 presigned upload urls during game creation."
                );
                return;
            }

            const uploadResponses = await Promise.allSettled(uploadPromises as Promise<Response>[]);
            console.log(uploadResponses);

            for (const response of uploadResponses) {
                if (response.status !== "fulfilled" || !response.value.ok) {
                    //Delete any created game data
                    await fetch(
                        `http://localhost:3001/api/deleteGame/${createGameResData.gameId}`,
                        {
                            credentials: "include",
                            method: "DELETE",
                        }
                    );
                    setErrorMsg(
                        "Image uploads failed, server may be down or experiencing issues, please try again later."
                    );
                    return;
                }
            }

            setIsLoading(false);
            void navigate("/my-games");
        } else {
            setErrorMsg("Client didn't understand server's response");
            return;
        }
    };

    if (errorMsg) throw new Error(errorMsg);

    return (
        <form
            className="mt-9 flex h-full w-5/6 justify-between"
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
                    {imageErrors.length > 0 && (
                        <div className="shadow-xs max-h-23 mb-1 overflow-y-auto rounded-md border border-red-200 bg-red-50 p-2 shadow-red-50">
                            {imageErrors.map((error, index) => (
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
                                        src={imageUrls[index]}
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
                                            minLength={5}
                                            maxLength={20}
                                            className="w-9/10 rounded-md border-none bg-transparent px-1 py-0.5 align-sub text-xl font-bold text-gray-700 outline-none focus:border-2 focus:border-black focus:bg-white"
                                            placeholder="(Enter character name)"
                                            required
                                        />
                                    </div>
                                </div>
                            ))
                        ) : isLoading ? (
                            <LoadingSpinner />
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
