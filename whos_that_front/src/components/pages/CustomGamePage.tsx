import { useNavigate } from "react-router";
import { useBetterAuthSession } from "../../lib/LayoutContextProvider.ts";
import { useState, useEffect } from "react";
import Dropzone from "../misc/Dropzone.tsx";
import { serverResponseSchema, acceptedImageTypesSchema } from "../../lib/zodSchema.ts";
import { createGameResponseSchema } from "@server/zodSchema";
import { resizeImages } from "../../lib/imageresizer.ts";
import { isHeic } from "heic-to";
import { heicTo } from "heic-to";
import LoadingSpinner from "../misc/LoadingSpinner.tsx";
import env from "../../lib/zodEnvSchema.ts";
import { logError, log } from "../../lib/logger.ts";
import ReactModal from "react-modal";

const MAX_FILESIZE_BYTES = 5 * 1024 * 1024;
const MIN_NUM_IMGS = 6;
const MAX_NUM_IMGS = 24;

const CreateCustomGamePage = () => {
    const navigate = useNavigate();
    const [useImageNames, setUseImageNames] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [fileNames, setFileNames] = useState<string[]>([]);
    const [isPublic, setIsPublic] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [imageErrors, setImageErrors] = useState<string[]>([]);
    const [errorMsg, setErrorMsg] = useState("");
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [showRulesModal, setShowRulesModal] = useState(true);

    const { session, isPending } = useBetterAuthSession();

    useEffect(() => {
        if (!session) void navigate("/");
    }, [session, navigate]);

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
                log(`${file.name} has type: ${file.type}`);
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
                    } else if (file.size > MAX_FILESIZE_BYTES) {
                        throw new Error(`${file.name} too large`);
                    } else if (!acceptedImageTypesSchema.safeParse(file.type).success) {
                        throw new Error(`${file.name} is of an invalid file type.`);
                    } else {
                        return file;
                    }
                } catch (error) {
                    log(error);
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

        if (selectedFiles.length < MIN_NUM_IMGS || selectedFiles.length > MAX_NUM_IMGS) {
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
            response = await fetch(`${env.VITE_SERVER_URL}/api/createNewGame`, {
                method: "POST",
                body: JSON.stringify(requestBody),
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
            });
        } catch (error) {
            logError(error);
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
            log(uploadResponses);

            for (const response of uploadResponses) {
                if (response.status !== "fulfilled" || !response.value.ok) {
                    //Delete any created game data
                    await fetch(
                        `${env.VITE_SERVER_URL}/api/deleteGame/${createGameResData.gameId}`,
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
        <>
            <form
                className="max-sm:items-center-safe my-auto flex h-fit w-full justify-evenly max-sm:mt-5 max-sm:flex-col max-sm:px-1 sm:px-5"
                onSubmit={(e) => {
                    void handleSubmit(e);
                }}
            >
                <div className="mr-5 w-[45%] max-w-3xl max-sm:w-full">
                    {/* Step 1 */}
                    <div className="border-x-1 shadow-lg/25 border-b-7 bg-linear-to-b mb-3 rounded-lg border-blue-600 from-blue-400 to-blue-500 to-75% p-4">
                        <label
                            htmlFor="title"
                            className="text-shadow-xs/75 m-auto block text-4xl font-medium text-white max-2xl:text-3xl max-md:text-center"
                        >
                            <div className="mr-3 inline-block h-11 w-11 content-center rounded-[50%] text-center align-middle font-bold text-amber-500">
                                <span className="font-digitag bottom-4.5 text-shadow-xs/50 relative right-1.5 text-7xl font-medium max-sm:text-6xl">
                                    1
                                </span>
                            </div>
                            Game Title:
                        </label>
                        <input
                            type="text"
                            name="title"
                            placeholder="(E.g. American Presidents, Famous Actors)"
                            className="sm:ml-13 inset-shadow-sm/15 block w-5/6 rounded-lg bg-white px-3 py-2 text-xl font-medium text-gray-900 max-sm:mx-auto"
                            required
                            minLength={5}
                            maxLength={20}
                        ></input>
                    </div>
                    {/* Step 2 */}
                    <div className="border-x-1 shadow-lg/25 border-b-7 bg-linear-to-b my-5 rounded-lg border-blue-600 from-blue-400 to-blue-500 to-75% p-4 max-2xl:my-3">
                        <label className="text-shadow-xs/75 m-auto block text-4xl font-medium text-white max-2xl:text-3xl max-md:text-center">
                            <div className="mr-3 inline-block h-11 w-11 content-center rounded-[50%] text-center align-middle font-bold text-amber-500">
                                <span className="font-digitag text-shadow-xs/50 relative bottom-4 right-1 text-7xl font-medium max-sm:bottom-2 max-sm:text-6xl">
                                    2
                                </span>
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
                            name="image-names"
                            className="ml-3 h-5 w-5 cursor-pointer appearance-auto border align-text-bottom accent-amber-500 shadow transition-all hover:shadow-md"
                            checked={useImageNames}
                            onChange={handleUseImageFilenames}
                        ></input>
                        <label
                            htmlFor="image-names"
                            className="text-shadow-xs/50 align-middle text-lg text-white max-2xl:text-base"
                        >
                            {" "}
                            Use File Names as Character Names
                        </label>
                    </div>
                    {/* Step 4 */}
                    <div className="border-x-1 shadow-lg/25 border-b-7 bg-linear-to-b flex items-center justify-between whitespace-pre-wrap rounded-lg border-blue-600 from-blue-400 to-blue-500 to-75% p-4 text-lg font-medium text-gray-900 max-sm:flex-col">
                        <div className="text-shadow-xs/75 ml-1 block text-4xl font-medium text-white max-2xl:text-3xl">
                            <div className="mr-3 inline-block h-11 w-11 content-center rounded-[50%] text-center align-middle font-bold text-amber-500">
                                <span className="font-digitag text-shadow-xs/50 relative bottom-0.5 right-2 text-7xl font-medium max-sm:text-6xl">
                                    4
                                </span>
                            </div>
                            Game Options:
                        </div>
                        <div>
                            <input
                                type="radio"
                                id="public"
                                value="public"
                                className="h-5 w-5 cursor-pointer appearance-auto border align-text-top transition-all"
                                name="privacy"
                                required
                                checked={isPublic}
                                onChange={handlePrivacyChange}
                            ></input>
                            <label
                                htmlFor="public"
                                className="text-shadow-xs/50 mr-5 align-middle text-xl text-white max-2xl:text-lg"
                            >
                                {" "}
                                Public
                            </label>
                            <input
                                type="radio"
                                id="private"
                                value="private"
                                className="h-5 w-5 cursor-pointer appearance-auto border align-text-top transition-all"
                                name="privacy"
                                required
                                checked={!isPublic}
                                onChange={handlePrivacyChange}
                            ></input>
                            <label
                                htmlFor="private"
                                className="text-shadow-xs/50 align-middle text-xl text-white max-2xl:text-lg"
                            >
                                {" "}
                                Private
                            </label>
                        </div>
                    </div>
                </div>
                <div className="max-w-4xl flex-1 max-sm:flex max-sm:flex-col">
                    {/* Step 3 */}
                    <div className="border-x-1 shadow-lg/25 border-b-7 bg-linear-to-b mb-3 rounded-lg border-blue-600 from-blue-400 to-blue-500 to-75% max-sm:mt-3 max-sm:p-3 sm:p-4">
                        <h3 className="text-shadow-xs/75 m-auto block text-4xl font-medium text-white max-2xl:text-3xl max-md:text-center">
                            <div className="mr-3 inline-block h-11 w-11 content-center rounded-[50%] text-center align-middle text-[4rem] font-bold leading-none text-amber-500">
                                <span className="font-digitag text-shadow-xs/50 relative bottom-3.5 text-7xl font-medium max-sm:bottom-5 max-sm:text-6xl">
                                    3
                                </span>
                            </div>
                            {selectedFiles.length > 0
                                ? "Character List: "
                                : "Your Characters Will Appear Here:  "}
                            {selectedFiles.length > 0 ? (
                                <button
                                    className="border-x-1 text-shadow-xs/40 active:shadow-2xs hover:shadow-sm/20 duration-15 hover:font-gray-200 shadow-md/20 mr-5 h-11 w-fit cursor-pointer rounded-md border-b-8 border-amber-700 bg-amber-600 px-2 text-xl font-semibold text-white transition-all hover:border-amber-800 hover:bg-amber-700 active:translate-y-[1px] active:border-none sm:float-right"
                                    disabled={isLoading}
                                    type="button"
                                    onClick={handleClearCharacterList}
                                >
                                    Clear List
                                </button>
                            ) : (
                                <></>
                            )}
                        </h3>
                        <div className="sm:max-h-143 inset-shadow-xs mt-3 overflow-y-auto rounded-md bg-gray-50 shadow-sm">
                            {selectedFiles.length > 0 ? (
                                selectedFiles.map((file, index) => (
                                    <div
                                        key={index}
                                        className={`flex items-center py-1.5 ${
                                            index % 2 === 0 ? "bg-gray-300" : "bg-gray-100"
                                        }`}
                                    >
                                        <button
                                            className="hover:text-shadow-red-800 text-shadow-sm ml-5 cursor-pointer text-3xl text-red-900 max-sm:ml-1"
                                            onClick={() => {
                                                handleRemoveImage(index);
                                            }}
                                            type="button"
                                        >
                                            X
                                        </button>
                                        <div className="text-3xl max-sm:mx-1 sm:mx-5">
                                            {index + 1}
                                        </div>
                                        <img
                                            src={imageUrls[index]}
                                            alt={file.name}
                                            className="h-34 max-sm:h-30 w-24 shrink-0 rounded border-2 object-cover max-sm:mr-1 max-sm:w-20 sm:mr-6"
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
                                                minLength={3}
                                                maxLength={20}
                                                className="w-1/2 rounded-md border-none bg-transparent px-1 py-0.5 align-sub text-2xl focus:border-2 focus:border-black focus:bg-white max-sm:mr-1 max-sm:w-full max-sm:text-lg"
                                                placeholder="(Enter character name)"
                                                required
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : isLoading ? (
                                <LoadingSpinner />
                            ) : (
                                <p className="p-10 text-lg italic text-gray-500">
                                    No images uploaded
                                </p>
                            )}
                        </div>
                        {selectedFiles.length > MAX_NUM_IMGS ? (
                            <p className="mt-2 rounded-md border border-red-400 bg-red-100 p-2 text-red-500">
                                You have too many characters! There is a maximum of {MAX_NUM_IMGS}.
                            </p>
                        ) : (
                            <></>
                        )}
                        {selectedFiles.length < MIN_NUM_IMGS ? (
                            <p className="mt-2 rounded-md border border-amber-300 bg-amber-100 p-2 text-gray-500">
                                Need at least {MIN_NUM_IMGS} characters!
                            </p>
                        ) : (
                            <></>
                        )}
                    </div>
                    <button
                        className={`border-b-9 text-shadow-xs/100 active:shadow-2xs duration-15 shadow-md/15 float-right mb-2 mr-5 w-fit cursor-pointer rounded-md border-x px-4 text-3xl font-bold text-white transition-all active:-translate-y-px active:border-none ${isLoading ? "border-gray-800 bg-gray-700" : "border-green-700 bg-green-600 hover:border-green-800 hover:bg-green-700 hover:text-gray-200"} py-4 max-2xl:py-3 max-2xl:text-2xl max-sm:mx-auto`}
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? "Loading..." : "Save Game"}
                    </button>
                </div>
            </form>
            <ReactModal
                isOpen={showRulesModal}
                onRequestClose={() => setShowRulesModal(false)}
                className="shadow-2xl/50 border-b-12 text-shadow-xs/100 bg-linear-to-b absolute left-1/2 top-1/2 mx-auto w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-lg border-x border-blue-600 from-blue-400 to-blue-500 p-8 text-center font-medium text-neutral-100 max-2xl:max-w-3xl"
                overlayClassName="fixed inset-0 bg-gray-700/75"
                shouldCloseOnOverlayClick={false}
                shouldCloseOnEsc={false}
            >
                <h2 className="mb-4 text-6xl font-bold text-orange-300">Rules</h2>
                <ul className="w-9/10 mx-auto mb-4 list-inside list-decimal space-y-2 whitespace-nowrap text-left text-2xl tracking-wide max-2xl:text-xl">
                    <li>
                        <span className="text-4xl font-bold text-orange-300 max-2xl:text-3xl">
                            Image content must be appropriate!
                        </span>
                        <br></br>
                        <span className="pl-10 text-lg text-orange-300 max-2xl:text-base">
                            No violence, nudity, controlled substances, or hate speech of any
                            kind.{" "}
                        </span>
                        <br></br>
                        <span className="pl-10 text-lg italic max-2xl:text-base">
                            Your content can be removed for any reason at moderator's discrection.
                        </span>
                    </li>
                    {/* <li>
                        <span className="font-bold text-amber-200">
                            Do not make public presets that already exist!
                        </span>
                        <br></br>
                        <span className="pl-10 text-lg">
                            Check the list of public games first, duplicate presets will be removed.
                        </span>
                    </li> */}
                    <li>
                        <span className="font-bold text-orange-300">
                            Images of real people must be public figures.
                        </span>
                        <br></br>
                        <span className="pl-10 text-lg max-2xl:text-base">
                            No public games made with images of family, friends etc.
                        </span>
                    </li>
                    <li>Images can be a maximum of 5MB.</li>
                    <li>Game titles are between 5-20 characters.</li>
                    <li>Character names are between 3-20 characters.</li>
                    <li>Each character should have a unique name.</li>
                </ul>
                <p className="w-9/10 mx-auto whitespace-pre-wrap text-center text-xl italic max-2xl:text-lg">
                    Note: images will work better if they feature the character in the center.{"\n"}
                    Vertical images also may work better than horizontal ones but try it out.
                </p>
                <button
                    onClick={() => setShowRulesModal(false)}
                    className="border-b-9 text-shadow-xs/100 active:shadow-2xs duration-15 hover:shadow-xs mt-4 w-3/5 cursor-pointer rounded-md border-x border-green-700 bg-green-600 py-4 text-3xl font-bold text-white shadow-sm transition-all hover:border-green-800 hover:bg-green-700 hover:text-gray-200 active:-translate-y-px active:border-none max-2xl:w-1/2 max-2xl:py-3 max-2xl:text-2xl"
                >
                    I Agree
                </button>
            </ReactModal>
        </>
    );
};
export default CreateCustomGamePage;
