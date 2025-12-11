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
import { PiEraserFill, PiGavelFill, PiPenNibFill } from "react-icons/pi";
import { FaCameraRetro } from "react-icons/fa";
import { FaGears } from "react-icons/fa6";
import { BsIncognito } from "react-icons/bs";

const MAX_FILESIZE_BYTES = 5 * 1024 * 1024;
const MIN_NUM_IMGS = 6;
const MAX_NUM_IMGS = 24;

/**
 * Game/preset creation page: handles image uploads, character naming, and privacy setting
 */
const CreateCustomGamePage = () => {
    const navigate = useNavigate();

    const [showRulesModal, setShowRulesModal] = useState(true);
    const [isLoading, setIsLoading] = useState(false); //Flag for submitting and image processing

    const [selectedFiles, setSelectedFiles] = useState<File[]>([]); //List of image files to upload
    const [charNames, setCharNames] = useState<string[]>([]); //Parallel list of character names

    const [imageUrls, setImageUrls] = useState<string[]>([]); //List of image urls for preview
    const [imageErrors, setImageErrors] = useState<string[]>([]); //Error msgs for invalid files

    const [useFileNames, setUseFileNames] = useState(false); //Option to use file names for char names
    const [isPublic, setIsPublic] = useState(true); //Privacy setting for this game

    const [errorMsg, setErrorMsg] = useState(""); //Used to throw error if set to non-empty string

    const { session, isPending } = useBetterAuthSession();
    //Redirect user if not logged in
    useEffect(() => {
        if (!session) void navigate("/");
    }, [session, navigate]);

    // Generates image urls for previewing uploaded images
    useEffect(() => {
        // Using useEffect so URLs can be revoked on clean up (i.e. no memory leaks)
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
        setCharNames(charNames.filter((_, i) => i !== index));
    };

    const handlePrivacyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsPublic(e.target.value === "public");
    };

    const handleUseImageFilenames = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUseFileNames(e.target.checked);
    };

    const handleClearCharacterList = () => {
        setSelectedFiles([]);
        setCharNames([]);
    };

    // Handles dismissing image error messages
    const handleRemoveError = (index: number) => {
        setImageErrors(imageErrors.filter((_, i) => i !== index));
    };

    /**
     * Validates images as user uploads them to browser
     * Checks file sizes and types, converts HEIC to JPEG
     */
    const handleFiles = async (files: FileList) => {
        if (files.length === 0) return;
        setIsLoading(true);
        const fileArray = [...files];
        const imageErrorsTemp: string[] = [];
        const validFiles: File[] = [];

        // Validate files + convert from HEIC
        const validFilePromises = await Promise.allSettled(
            fileArray.map(async (file) => {
                log(`${file.name} has type: ${file.type}`);
                try {
                    if (await isHeic(file)) {
                        // Convert HEIC to JPEG
                        const blobAsJpeg = await heicTo({
                            blob: file,
                            type: "image/jpeg",
                        });
                        return new File([blobAsJpeg], file.name, {
                            type: "image/jpeg",
                            lastModified: Date.now(),
                        });
                    } else if (file.size > MAX_FILESIZE_BYTES) {
                        throw new Error(`${file.name} is too large (max 5MB).`);
                    } else if (!acceptedImageTypesSchema.safeParse(file.type).success) {
                        // This type validation doesn't work on HEIC, keep isHeic check early
                        throw new Error(`${file.name} is of an invalid file type.`);
                    } else {
                        return file;
                    }
                } catch (error) {
                    logError(error);
                    if (error instanceof Error) {
                        throw error;
                    }
                    throw new Error(`${file.name} had validation error.`);
                }
            })
        );

        // Separate errors from valid files
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

        if (useFileNames)
            setCharNames([
                ...charNames,
                ...validFiles.map((file) =>
                    file.name
                        .replace(/\.[^./]+$/, "")
                        .replaceAll("_", " ")
                        .substring(0, 20)
                ),
            ]);
        else {
            const emptyFileNames = Array.from({ length: validFiles.length }).fill("") as string[];
            setCharNames([...charNames, ...emptyFileNames]);
        }
        setIsLoading(false);
    };

    /**
     * Handles game creation workflow:
     * 1. Compress images client-side
     * 2. Request presigned S3 URLs from server
     * 3. Upload images directly to S3
     * 4. Rollback on failure
     */
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);

        if (selectedFiles.length < MIN_NUM_IMGS || selectedFiles.length > MAX_NUM_IMGS) {
            setIsLoading(false);
            return;
        }

        const compressImagesResults = await resizeImages(selectedFiles);
        const compressedFiles: File[] = [];
        const failedFiles: string[] = [];

        for (const [i, result] of compressImagesResults.entries()) {
            if (result.status === "fulfilled") {
                compressedFiles.push(result.value);
            } else {
                failedFiles.push(selectedFiles[i].name);
            }
        }

        if (failedFiles.length > 0) {
            setImageErrors([
                ...imageErrors,
                ...failedFiles.map((name) => `${name} failed during compression`),
            ]);
            const successNames = new Set(compressedFiles.map((f) => f.name));
            setSelectedFiles(selectedFiles.filter((f) => successNames.has(f.name)));
            setCharNames(charNames.filter((_, i) => successNames.has(selectedFiles[i].name)));
            setIsLoading(false);
            return;
        }

        const requestBody = {
            title: formData.get("title") as string,
            privacy: formData.get("privacy") as string,
            namesAndFileTypes: compressedFiles.map((f, i) => ({
                type: f.type,
                name: charNames[i],
            })),
        };

        let response;
        try {
            // Request presigned S3 URLs + game metadata
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
        // Response contains the generated gameId and "gameItems": a list of objects with
        // character names as key + obj containing upload url & generated imageIds (used in S3 key) as values
        if (validateCreateGameRes.success) {
            const createGameResData = validateCreateGameRes.data;

            //Upload to S3
            const uploadPromises = compressedFiles.map((file, i) =>
                charNames[i] in createGameResData.gameItems
                    ? fetch(createGameResData.gameItems[charNames[i]].signedUrl, {
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

            // Verify upload responses, attempt rollback if any uplaods failed
            for (const response of uploadResponses) {
                if (response.status !== "fulfilled" || !response.value.ok) {
                    await fetch(
                        `${env.VITE_SERVER_URL}/api/deleteGame/${createGameResData.gameId}`,
                        {
                            credentials: "include",
                            method: "DELETE",
                        }
                    );
                    setErrorMsg("Image uploads failed, please try again later.");
                    return;
                }
            }

            setIsLoading(false);
            void navigate("/my-games");
        } else {
            setErrorMsg("Client didn't understand server's response.");
            return;
        }
    };

    if (errorMsg) throw new Error(errorMsg);
    return (
        <>
            <form
                className="w-9/10 py-3 text-neutral-800 max-lg:mt-7 max-lg:flex max-lg:flex-col max-lg:justify-center max-lg:gap-4 lg:mt-1 lg:grid lg:grid-flow-row-dense lg:grid-cols-2 lg:grid-rows-1 lg:justify-items-center lg:gap-6 2xl:gap-x-0 2xl:gap-y-4"
                onSubmit={(e) => {
                    void handleSubmit(e);
                }}
            >
                <div className="2xl:w-9/10 flex flex-col gap-4 max-2xl:w-full lg:col-start-1">
                    {/* Step 1: Title */}
                    <div className="rounded-xs flex h-fit w-full flex-col items-center justify-around border border-neutral-800 bg-neutral-300 px-2 py-1 text-center">
                        <label
                            htmlFor="title"
                            className="xl:p-1.25 flex items-center p-px text-center text-lg font-semibold xl:text-xl 2xl:text-2xl"
                        >
                            <PiPenNibFill
                                className="relative bottom-px mr-1 scale-x-[-1]"
                                size="1.25em"
                            />
                            <div>Title/Theme</div>
                            <PiPenNibFill className="relative bottom-px ml-1" size="1.25em" />
                        </label>
                        <input
                            type="text"
                            name="title"
                            placeholder="(E.g. Superheros, Famous Actors)"
                            className="border-groove lg:w-9/10 rounded border border-neutral-400 bg-neutral-50 p-1 text-center font-medium placeholder:text-gray-400 max-lg:w-full xl:text-lg 2xl:text-xl"
                            required
                            minLength={5}
                            maxLength={18}
                        ></input>
                    </div>
                    {/* Step 4: Privacy Settings */}
                    <div className="rounded-xs flex h-fit w-full flex-col items-center justify-around border border-neutral-800 bg-neutral-300 px-2 py-1 text-center">
                        <div className="flex p-px text-lg font-semibold xl:text-xl 2xl:text-2xl">
                            <FaGears size="1.5em" className="mr-1 scale-y-[-1]" />
                            <div>Game Options</div>
                            <FaGears size="1.5em" className="ml-1 scale-x-[-1] scale-y-[-1]" />
                        </div>
                        <div className="mb-0.5 mt-1 xl:text-lg 2xl:text-xl">
                            <input
                                type="radio"
                                id="public"
                                value="public"
                                className="mr-1 h-4 w-4 cursor-pointer appearance-auto border align-text-top transition-all"
                                name="privacy"
                                required
                                checked={isPublic}
                                onChange={handlePrivacyChange}
                            ></input>
                            <label htmlFor="public" className="mr-5 font-medium">
                                Public
                            </label>
                            <input
                                type="radio"
                                id="private"
                                value="private"
                                className="mr-1 h-4 w-4 cursor-pointer appearance-auto border align-text-top transition-all"
                                name="privacy"
                                required
                                checked={!isPublic}
                                onChange={handlePrivacyChange}
                            ></input>
                            <label htmlFor="private" className="font-medium">
                                Private
                            </label>
                        </div>
                    </div>
                    {/* Step 2: Image Uploads */}
                    <div className="rounded-xs flex h-fit w-full flex-col items-center justify-around border border-neutral-800 bg-neutral-300 py-1 text-center max-lg:px-2 lg:px-4">
                        <label className="flex p-px text-lg font-semibold xl:p-2 xl:text-xl 2xl:text-2xl">
                            <FaCameraRetro size="1.18em" className="relative top-px mr-1" />
                            <div>Upload Custom Images</div>
                            <FaCameraRetro size="1.18em" className="relative top-px ml-1" />
                        </label>
                        <Dropzone
                            fileHandler={(files) => {
                                void handleFiles(files);
                            }}
                        />
                        {/* Image errors during upload or compression */}
                        {imageErrors.length > 0 && (
                            <div className="max-h-23 2xl:w-6/10 mt-1 overflow-y-auto rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 shadow-red-50">
                                {imageErrors.map((error, index) => (
                                    <p key={index} className="text-sm font-medium text-red-600">
                                        <span className="sm:pl-1">{"Error: " + error}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveError(index)}
                                            className="float-right ml-2 cursor-pointer text-black hover:text-red-800"
                                        >
                                            ✕
                                        </button>
                                    </p>
                                ))}
                            </div>
                        )}
                        {/* Character names as file names toggle */}
                        <div className="items-baseline-last mb-1.25 mt-2.25 flex justify-between gap-1">
                            <input
                                type="checkbox"
                                name="image-names"
                                className="inset-shadow-xs border-groove xl:h-4.5 xl:w-4.5 2xl:top-0.75 relative h-4 w-4 cursor-pointer appearance-auto rounded border accent-red-500 max-2xl:top-0.5 2xl:h-5 2xl:w-5"
                                checked={useFileNames}
                                onChange={handleUseImageFilenames}
                            ></input>
                            <label
                                htmlFor="image-names"
                                className="text-sm font-medium text-neutral-600 2xl:text-base"
                            >
                                Use File Names as Character Names
                            </label>
                        </div>
                    </div>
                </div>

                {/* Step 3: Character Names */}
                <div className="rounded-xs 2xl:w-9/10 flex h-fit flex-col justify-around border border-neutral-800 bg-neutral-300 px-2 py-1 text-center max-2xl:w-full lg:col-start-2">
                    <h3 className="mb-0.5 flex items-center justify-end py-1">
                        <div className="mx-auto flex p-px text-lg font-semibold xl:text-xl 2xl:text-2xl">
                            <BsIncognito size="1.33em" className="relative top-px mr-1" />
                            <div>
                                {selectedFiles.length > 0
                                    ? "Character List "
                                    : "Characters Will Appear Here  "}
                            </div>
                            <BsIncognito size="1.33em" className="relative top-px ml-1" />
                        </div>

                        {/* Clear list button */}
                        {selectedFiles.length > 0 ? (
                            <button
                                className="rounded-xs lg:px-1.75 lg:py-0.75 ml-6 flex cursor-pointer items-center bg-red-400 font-medium text-white hover:bg-red-500 max-lg:px-1 max-lg:py-px lg:mr-4"
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
                    <div className="max-lg:max-h-120 lg:max-h-154 border-groove rounded-xs overflow-y-auto border border-neutral-600 bg-zinc-50 2xl:grid 2xl:grid-cols-2">
                        {/* Dynamic list of characters */}
                        {selectedFiles.length > 0 ? (
                            selectedFiles.map((file, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center border-b border-zinc-400 py-1.5 ${
                                        index % 4 === 0 || index % 4 === 3
                                            ? "bg-zinc-200"
                                            : "bg-zinc-50"
                                    } ${index % 2 === 0 ? "border-r" : ""}`}
                                >
                                    <div className="mx-1 flex flex-col items-center justify-between">
                                        <PiEraserFill
                                            className="mb-1 scale-x-[-1] cursor-pointer text-red-300 hover:scale-110 hover:text-red-900"
                                            size="1.5em"
                                            onClick={() => {
                                                handleRemoveImage(index);
                                            }}
                                        />
                                        <div className="text-xl font-medium max-sm:mx-1 sm:mx-5">
                                            {index + 1}
                                        </div>
                                    </div>

                                    <img
                                        src={imageUrls[index]}
                                        alt={file.name}
                                        className="h-34 max-sm:h-30 w-24 shrink-0 rounded border object-cover"
                                    />
                                    <div className="min-w-0">
                                        <input
                                            type="text"
                                            value={charNames[index] || ""}
                                            onChange={(e) => {
                                                const names = [...charNames];
                                                names[index] = e.target.value;
                                                setCharNames(names);
                                            }}
                                            minLength={3}
                                            maxLength={20}
                                            className="max-w-9/10 rounded border-2 border-neutral-400 bg-neutral-100 px-1 py-px text-center font-medium placeholder:text-zinc-400"
                                            placeholder={`[Insert #${index + 1}'s Name]`}
                                            required
                                        />
                                    </div>
                                </div>
                            ))
                        ) : isLoading ? (
                            <LoadingSpinner />
                        ) : (
                            <p className="p-10 italic text-gray-500">No images uploaded</p>
                        )}
                    </div>
                    {/* Character/image min and max warnings */}
                    {selectedFiles.length > MAX_NUM_IMGS ? (
                        <p className="min-w-9/10 mx-auto mb-0.5 mt-2 rounded-md border border-red-200 bg-red-100 py-1 text-gray-500">
                            You have too many characters! There is a maximum of {MAX_NUM_IMGS}.
                        </p>
                    ) : (
                        <></>
                    )}
                    {selectedFiles.length < MIN_NUM_IMGS ? (
                        <p className="min-w-9/10 py-0.75 mx-auto mb-0.5 mt-2 rounded-md border border-amber-200 bg-amber-100 text-neutral-500">
                            Need at least {MIN_NUM_IMGS} characters!
                        </p>
                    ) : (
                        <></>
                    )}
                </div>

                {/* Submit Button */}
                <button
                    className={`rounded-xs-xs mx-auto w-1/2 p-1 text-center text-lg font-medium text-white ${isLoading ? "border-gray-800 bg-gray-700" : "bg-red-400 hover:bg-red-500"} h-fit cursor-pointer lg:col-start-2`}
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading ? "Loading..." : "Save Game"}
                </button>
            </form>
            {/* Rules Modal */}
            <ReactModal
                isOpen={showRulesModal}
                onRequestClose={() => setShowRulesModal(false)}
                className="absolute left-1/2 top-1/2 mx-auto flex h-fit w-[97%] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col gap-4 border-2 border-neutral-800 bg-neutral-200 px-2 text-center shadow-lg max-lg:py-5 lg:py-8"
                overlayClassName="fixed inset-0 bg-zinc-900/70"
                shouldCloseOnOverlayClick={false}
                shouldCloseOnEsc={false}
            >
                <div className="flex items-center justify-center gap-2 text-xl max-lg:mb-1 lg:mb-2">
                    <PiGavelFill size="2.5em" className="" />
                    <h2 className="text-center text-5xl font-bold">Rules</h2>
                    <PiGavelFill size="2.5em" className="scale-x-[-1]" />
                </div>
                <ul className="mx-auto mb-2 list-inside list-decimal space-y-2 text-center text-xl font-medium">
                    <li className="text-xl">
                        <span className="text-shadow-2xs/20 text-xl font-semibold text-orange-500 2xl:text-2xl">
                            Image content must be appropriate.
                        </span>
                        <br></br>
                        <span className="text-base font-normal 2xl:text-lg">
                            No violence, nudity, controlled substances, hate speech, etc.{" "}
                        </span>
                        <span className="text-base font-medium italic 2xl:text-lg">
                            Your preset can be removed for any reason at moderator's discrection.
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
                        <span className="text-shadow-2xs/20 text-xl font-semibold text-orange-500 2xl:text-2xl">
                            In public presets: Images of real people must be notable figures.
                        </span>
                        <br></br>
                        <span className="text-base font-normal 2xl:text-lg">
                            Public presets cannot contain images of friends, family, classmates,
                            coworkers, etc.
                        </span>
                    </li>
                </ul>
                <button
                    onClick={() => setShowRulesModal(false)}
                    className={`rounded-xs lg:w-3/10 mx-auto w-1/2 p-1 text-center text-lg font-medium text-white md:w-1/3 ${isLoading ? "border-gray-800 bg-gray-700" : "bg-red-400 hover:bg-red-500"} cursor-pointer`}
                >
                    I Agree
                </button>
                <p className="w-9/10 mx-auto text-base italic text-neutral-700">
                    Tip: images will look best when they feature the "character" near the center.
                </p>
            </ReactModal>
        </>
    );
};
export default CreateCustomGamePage;
