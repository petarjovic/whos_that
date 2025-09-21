import { useFetcher, useNavigate } from "react-router";
import { authClient } from "../lib/auth-client";
import { useState } from "react";
import Dropzone from "../lib/Dropzone.tsx";

const CreateCustomGamePage = () => {
    const fetcher = useFetcher();
    const busy = fetcher.state !== "idle";
    const navigate = useNavigate();
    const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSizeBytes = 5 * 1024 * 1024;
    const [useImageNames, setUseImageNames] = useState(true);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [fileNames, setFileNames] = useState<string[]>([]);
    const [isPublic, setIsPublic] = useState(true);
    const [errors, setErrors] = useState<string[]>([]);

    const {
        data: session,
        isPending, //loading state
        error, //error object
    } = authClient.useSession(); //ERROR HANDLING

    if (isPending) return <div>Loading...</div>;
    else if (!session) {
        void navigate("/");
        return <></>; // THIS RETURN STATEMENT IS A HACK TO TELL TS THAT SESSION CANNOT BE NULL
    } else if (error) void navigate("/");

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

    const handleFiles = (files: FileList) => {
        if (files.length === 0) return;
        const fileArray = Array.from(files);
        const fileErrors: string[] = [];

        const validFiles = fileArray.filter((file) => {
            if (!acceptedImageTypes.includes(file.type)) {
                fileErrors.push(`${file.name} is of an invalid file type.`);
            } else if (file.size > maxSizeBytes) {
                fileErrors.push(`${file.name} too large.`);
            } else {
                return true;
            }
        });

        setErrors(fileErrors);

        setSelectedFiles([...selectedFiles, ...validFiles]);

        if (useImageNames)
            setFileNames([
                ...fileNames,
                ...validFiles.map((file) => file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ")),
            ]);
        else setFileNames([...fileNames, ...(Array(validFiles.length).fill("") as string[])]);
        console.log(errors);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();

        const formData = new FormData(e.currentTarget);

        selectedFiles.forEach((file, i) => {
            formData.append("images", file);
            formData.append("names", fileNames[i]);
        });

        formData.append("user", session.user.id);

        // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
        const result = await fetcher.submit(formData, {
            method: "post",
            action: "/create-game/new/createNewGameAction",
            encType: "multipart/form-data",
        });

        console.log(result);

        console.log(Array.from(formData.keys()));
        console.log(Array.from(formData.values()));
    };

    return (
        <form
            className="flex justify-between w-5/6 h-full mt-9"
            encType="multipart/form-data"
            onSubmit={(e) => {
                void handleSubmit(e);
            }}
        >
            <div className="w-[45%] mr-10">
                {/* Step 1 */}
                <div className="bg-white rounded-lg shadow-sm border-1 border-slate-300 p-4 mr-2 mb-3">
                    <label
                        htmlFor="title"
                        className="block text-2xl font-medium text-gray-900 m-auto"
                    >
                        <div className="inline-block bg-blue-500 font-semibold rounded-[50%] w-11 h-11 mr-3 text-white text-center content-center">
                            1
                        </div>
                        Give your game a clear title:
                    </label>
                    <input
                        type="text"
                        name="title"
                        placeholder="(E.g. American Presidents, Famous Actors)"
                        className="bg-gray-50 border font-medium border-slate-400 text-gray-900 text-lg rounded-lg focus:ring-blue-500 focus:border-blue-500 block ml-13 w-5/6 p-2.5"
                        required
                        minLength={5}
                        maxLength={30}
                    ></input>
                </div>
                {/* Step 2 */}
                <div className="bg-white rounded-lg shadow-sm border-1 border-slate-300 p-4 mr-2 mb-3">
                    <label className="block whitespace-pre-wrap text-2xl font-medium text-gray-900 m-auto">
                        <div className="inline-block bg-blue-500 rounded-[50%] font-semibold w-11 h-11 mr-3 text-white text-center content-center whitespace-pre-wrap">
                            2
                        </div>
                        Start uploading your images:{"  "}
                    </label>

                    <Dropzone fileHandler={handleFiles} />
                    {errors.length > 0 && (
                        <div className="mb-1 p-2 shadow-xs shadow-red-50 bg-red-50 border border-red-200 rounded-md overflow-y-auto max-h-23">
                            {errors.map((error, index) => (
                                <p key={index} className="text-sm text-red-600 ">
                                    {"Error: " + error}
                                </p>
                            ))}
                        </div>
                    )}
                    <input
                        type="checkbox"
                        id="image-names"
                        className="ml-3 h-4 w-4 cursor-pointer transition-all appearance-auto shadow hover:shadow-md border border-slate-300 checked:bg-blue-600 checked:border-blue-600 align-text-bottom"
                        checked={useImageNames}
                        onChange={handleUseImageFilenames}
                    ></input>
                    <label htmlFor="image-names" className="align-middle text-sm">
                        {" "}
                        Use File Names as Character Names
                    </label>
                </div>
                {/* Step 4 */}
                <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border-1 border-slate-300 p-4 mr-2 mb-5 whitespace-pre-wrap font-medium text-lg text-gray-900">
                    <div className="block text-2xl font-medium text-gray-900">
                        <div className="inline-block bg-blue-500 font-semibold rounded-[50%] w-11 h-11 mr-3 text-2xl text-white text-center content-center ">
                            4
                        </div>
                        Game Options:
                    </div>
                    <div>
                        <input
                            type="radio"
                            id="public"
                            value="public"
                            className="h-5 w-5 cursor-pointer transition-all appearance-auto hover:shadow-md border border-slate-300 checked:bg-blue-600 checked:border-blue-600 align-text-top "
                            name="privacy"
                            required
                            checked={isPublic}
                            onChange={handlePrivacyChange}
                        ></input>
                        <label htmlFor="public" className="align-middle mr-5">
                            {" "}
                            Public
                        </label>
                        <input
                            type="radio"
                            id="private"
                            value="private"
                            className="h-5 w-5 cursor-pointer transition-all appearance-auto  hover:shadow-md border border-slate-300 checked:bg-blue-600 checked:border-blue-600 align-text-top"
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
                <div className="bg-white rounded-lg shadow-sm border-1 border-slate-300 p-4 mr-2 mb-3">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-2 whitespace-pre-wrap">
                        <div className="inline-block bg-blue-500 font-bold rounded-[50%] w-11 h-11 mr-3 text-white text-center content-center">
                            3
                        </div>
                        {selectedFiles.length > 0
                            ? "Character List: "
                            : "Your Characters Will Appear Here:  "}
                        <button
                            className={`float-right px-2 mr-5 w-fit h-11 text-xl text-neutral-100 font-semibold border-b-8 border-x-1 border-slate-500 bg-slate-400 hover:bg-slate-500 hover:border-slate-600 rounded-md cursor-pointer shadow-md text-shadow-xs active:border-none active:translate-y-[1px] active:shadow-2xs active:inset-shadow-md ${
                                selectedFiles.length > 0 ? "" : "hidden"
                            }`}
                            disabled={busy}
                            type="button"
                            onClick={handleClearCharacterList}
                        >
                            Clear List
                        </button>
                    </h3>
                    <div className="bg-gray-50 border border-gray-200 rounded-md overflow-y-auto max-h-135 shadow-sm mt-3">
                        {selectedFiles.length > 0 ? (
                            selectedFiles.map((file, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center py-2 ${
                                        index % 2 === 0 ? "bg-gray-300" : "bg-gray-100"
                                    }`}
                                >
                                    <button
                                        className="ml-5 text-lg hover:underline hover:cursor-pointer"
                                        onClick={() => {
                                            handleRemoveImage(index);
                                        }}
                                    >
                                        X
                                    </button>
                                    <div className="text-2xl font-bold mx-5">{index + 1}</div>
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt={file.name}
                                        className="w-20 h-30 object-cover rounded border border-gray-300 flex-shrink-0 mr-6"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <input
                                            type="text"
                                            value={fileNames[index] || ""}
                                            onChange={(e) => {
                                                const newNames = [...fileNames];
                                                newNames[index] = e.target.value;
                                                setFileNames(newNames);
                                            }}
                                            className="text-xl align-sub font-bold text-gray-700 bg-transparent border-none outline-none w-9/10 focus:bg-white focus:border-2 focus:border-black px-1 py-0.5 rounded-md"
                                            placeholder="(Enter character name)"
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 italic p-10">No images uploaded</p>
                        )}
                    </div>
                    {selectedFiles.length > 24 ? (
                        <p className="p-2 shadow-xs shadow-red-50 bg-red-50 border border-red-200 rounded-md text-red-500 mt-2">
                            You have too many characters! There is a maximum of 24.
                        </p>
                    ) : (
                        <></>
                    )}
                    {selectedFiles.length < 6 ? (
                        <p className="p-2 bg-amber-50 border border-amber-200 rounded-md text-slate-500 mt-2">
                            Need at least 6 characters!
                        </p>
                    ) : (
                        <></>
                    )}
                </div>
                <button
                    className="float-right px-2 mr-5 w-42 h-17 text-2xl text-neutral-100 font-bold border-b-9 border-x-1 border-blue-600 bg-blue-500 hover:bg-blue-600 hover:border-blue-700 rounded-md cursor-pointer shadow-md text-shadow-xs active:border-none active:translate-y-[1px] active:shadow-2xs  active:inset-shadow-md"
                    type="submit"
                    disabled={busy}
                >
                    {busy ? "Saving..." : "Save Game"}
                </button>
            </div>
        </form>
    );
};
export default CreateCustomGamePage;
