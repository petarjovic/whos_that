import { useNavigation, useNavigate, useSubmit } from "react-router";
import { authClient } from "../lib/auth-client";
import { useState } from "react";
import Dropzone from "../lib/Dropzone.tsx";

const CreateCustomGamePage = () => {
    const submit = useSubmit();
    const navigation = useNavigation();
    const busy = navigation.state !== "idle";
    const navigate = useNavigate();
    const acceptedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
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
        const fileArray = [...files];
        const fileErrors: string[] = [];

        const validFiles = fileArray.filter((file) => {
            if (!acceptedImageTypes.has(file.type)) {
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
                ...validFiles.map((file) =>
                    file.name.replace(/\.[^./]+$/, "").replaceAll("_", " ")
                ),
            ]);
        else {
            const emptyFileNames = Array.from({ length: validFiles.length }).fill("") as string[];
            setFileNames([...fileNames, ...emptyFileNames]);
        }
        console.log(errors);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();

        const formData = new FormData(e.currentTarget);

        selectedFiles.forEach((file, i) => {
            formData.append("images", file);
            formData.append("names", fileNames[i]);
        });

        formData.append("user", session.user.id);

        void submit(formData, {
            method: "post",
            action: "/create-game/new/createNewGameAction",
            encType: "multipart/form-data",
            replace: true,
        });

        console.log([...formData.keys()]);
        console.log([...formData.values()]);
    };

    return (
        <form
            className="mt-9 flex h-full w-5/6 justify-between"
            encType="multipart/form-data"
            onSubmit={handleSubmit}
        >
            <div className="mr-10 w-[45%]">
                {/* Step 1 */}
                <div className="border-1 mb-3 mr-2 rounded-lg border-slate-300 bg-white p-4 shadow-sm">
                    <label
                        htmlFor="title"
                        className="m-auto block text-2xl font-medium text-gray-900"
                    >
                        <div className="mr-3 inline-block h-11 w-11 content-center rounded-[50%] bg-blue-500 text-center font-semibold text-white">
                            1
                        </div>
                        Give your game a clear title:
                    </label>
                    <input
                        type="text"
                        name="title"
                        placeholder="(E.g. American Presidents, Famous Actors)"
                        className="ml-13 block w-5/6 rounded-lg border border-slate-400 bg-gray-50 p-2.5 text-lg font-medium text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                        required
                        minLength={5}
                        maxLength={30}
                    ></input>
                </div>
                {/* Step 2 */}
                <div className="border-1 mb-3 mr-2 rounded-lg border-slate-300 bg-white p-4 shadow-sm">
                    <label className="m-auto block whitespace-pre-wrap text-2xl font-medium text-gray-900">
                        <div className="mr-3 inline-block h-11 w-11 content-center whitespace-pre-wrap rounded-[50%] bg-blue-500 text-center font-semibold text-white">
                            2
                        </div>
                        Start uploading your images:{"  "}
                    </label>

                    <Dropzone fileHandler={handleFiles} />
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
                        className="ml-3 h-4 w-4 cursor-pointer appearance-auto border border-slate-300 align-text-bottom shadow transition-all checked:border-blue-600 checked:bg-blue-600 hover:shadow-md"
                        checked={useImageNames}
                        onChange={handleUseImageFilenames}
                    ></input>
                    <label htmlFor="image-names" className="align-middle text-sm">
                        {" "}
                        Use File Names as Character Names
                    </label>
                </div>
                {/* Step 4 */}
                <div className="border-1 mb-5 mr-2 flex items-center justify-between whitespace-pre-wrap rounded-lg border-slate-300 bg-white p-4 text-lg font-medium text-gray-900 shadow-sm">
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
                            className="h-5 w-5 cursor-pointer appearance-auto border border-slate-300 align-text-top transition-all checked:border-blue-600 checked:bg-blue-600 hover:shadow-md"
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
                            className="h-5 w-5 cursor-pointer appearance-auto border border-slate-300 align-text-top transition-all checked:border-blue-600 checked:bg-blue-600 hover:shadow-md"
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
                <div className="border-1 mb-3 mr-2 rounded-lg border-slate-300 bg-white p-4 shadow-sm">
                    <h3 className="mb-2 whitespace-pre-wrap text-2xl font-semibold text-gray-900">
                        <div className="mr-3 inline-block h-11 w-11 content-center rounded-[50%] bg-blue-500 text-center font-bold text-white">
                            3
                        </div>
                        {selectedFiles.length > 0
                            ? "Character List: "
                            : "Your Characters Will Appear Here:  "}
                        <button
                            className={`border-x-1 text-shadow-xs active:shadow-2xs active:inset-shadow-md float-right mr-5 h-11 w-fit cursor-pointer rounded-md border-b-8 border-slate-500 bg-slate-400 px-2 text-xl font-semibold text-neutral-100 shadow-md hover:border-slate-600 hover:bg-slate-500 active:translate-y-[1px] active:border-none ${
                                selectedFiles.length > 0 ? "" : "hidden"
                            }`}
                            disabled={busy}
                            type="button"
                            onClick={handleClearCharacterList}
                        >
                            Clear List
                        </button>
                    </h3>
                    <div className="max-h-135 mt-3 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 shadow-sm">
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
                                        />
                                    </div>
                                </div>
                            ))
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
                    className="w-42 h-17 border-b-9 border-x-1 text-shadow-xs active:shadow-2xs active:inset-shadow-md float-right mr-5 cursor-pointer rounded-md border-blue-600 bg-blue-500 px-2 text-2xl font-bold text-neutral-100 shadow-md hover:border-blue-700 hover:bg-blue-600 active:translate-y-[1px] active:border-none"
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
