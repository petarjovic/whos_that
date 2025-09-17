import { useFetcher, useNavigate } from "react-router";
import { authClient } from "../lib/auth-client";
import { useState } from "react";

const CreateCustomGamePage = () => {
    const fetcher = useFetcher();
    const busy = fetcher.state !== "idle";
    const navigate = useNavigate();
    const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSizeBytes = 5 * 1024 * 1024;
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);

    const {
        data: session,
        isPending, //loading state
        error, //error object
    } = authClient.useSession(); //ERROR HANDLING

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) handleFiles(e.target.files);
        // Reset input value to allow selecting same files again if needed
        e.target.value = "";
    };

    const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleFiles = (files: FileList) => {
        if (files.length === 0) return;
        const fileArray = Array.from(files);
        try {
            for (const file of fileArray) {
                if (!acceptedImageTypes.includes(file.type)) {
                    throw new Error("Invalid file type.");
                } else if (file.size > maxSizeBytes) {
                    throw new Error("One or more files are too large.");
                }
            }
            setSelectedFiles(fileArray);
        } catch (error) {
            console.log(String(error)); //HANDLE ERRORS BETTER LATER
        }
    };

    const handleDragOverandEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        // Only set to false if leaving the dropzone container
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragOver(false);
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();

        const formData = new FormData(e.currentTarget);

        selectedFiles.forEach((file) => {
            formData.append(`images`, file);
        });

        // void fetcher.submit(formData, {
        //     method: "post",
        //     action: "/create-game/new/uploadImageAction",
        //     encType: "multipart/form-data",
        // });
        console.log(selectedFiles);
    };

    if (isPending) return <div>Loading...</div>;
    else if (!session) void navigate("/");

    return (
        <form className="mt-10 w-2/5" encType="multipart/form-data" onSubmit={handleSubmit}>
            <label htmlFor="custom-game-name" className="block text-2xl font-bold text-gray-900">
                Step 1: What is the theme of your game?
            </label>
            <input
                type="text"
                name="custom-game-name"
                placeholder="Game Theme"
                className="bg-white placeholder:text-gray-400 text-slate-700 text-2xl border border-slate-200 rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm hover:shadow-md focus:shadow-lg mx-2 mt-2 mb-5 hover:bg-slate-100"
                required
                minLength={5}
                maxLength={30}
            ></input>
            <p className="block text-2xl font-bold text-gray-900">
                Step 2: Upload your custom images!
            </p>
            <div
                className="flex items-center justify-center w-full"
                onDrop={handleFileDrop}
                onDragOver={handleDragOverandEnter}
                onDragEnter={handleDragOverandEnter}
                onDragLeave={handleDragLeave}
            >
                <label
                    htmlFor="file-upload"
                    className={`flex flex-col items-center justify-center w-full h-64 border shadow-sm rounded-lg cursor-pointer my-2 transition-all duration-200 ${
                        isDragOver
                            ? "border-blue-500 border-2 bg-blue-50 dark:bg-blue-900/20"
                            : "border-slate-200 bg-white hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:hover:border-slate-500"
                    }`}
                >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg
                            className={`w-8 h-8 mb-4 transition-colors duration-200 ${
                                isDragOver ? "text-blue-500" : "text-gray-500 dark:text-gray-400"
                            }`}
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 20 16"
                        >
                            <path
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                            />
                        </svg>
                        <p
                            className={`mb-2 text-sm transition-colors duration-200 ${
                                isDragOver
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-gray-500 dark:text-gray-400"
                            }`}
                        >
                            <span
                                className={`font-semibold hover:underline ${
                                    isDragOver ? "text-blue-600" : "text-blue-500"
                                }`}
                            >
                                {isDragOver ? "Drop images here" : "Click to upload"}
                            </span>{" "}
                            {isDragOver || "or drag and drop"}
                        </p>
                        <p
                            className={`text-xs transition-colors duration-200 ${
                                isDragOver
                                    ? "text-blue-500 dark:text-blue-400"
                                    : "text-gray-500 dark:text-gray-400"
                            }`}
                        >
                            PNG or JPG
                        </p>
                    </div>
                    <input
                        multiple
                        id="file-upload"
                        type="file"
                        className="hidden"
                        accept={acceptedImageTypes.join(",")}
                        onChange={handleFileInputChange}
                    />
                </label>
            </div>

            <div className="mt-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Selected Files:</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3 max-h-48 overflow-y-auto">
                    {selectedFiles.length > 0 ? (
                        selectedFiles.map((file, index) => (
                            <div key={index} className="flex items-center py-2">
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt={file.name}
                                    className="w-12 h-12 object-cover rounded border border-gray-300 mr-3 flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm text-gray-700 truncate block">
                                        {file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ")}
                                    </span>
                                </div>
                                <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                    {(file.size / 1024 / 1024).toFixed(1)} MB
                                </span>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500 italic">No files selected</p>
                    )}
                </div>
            </div>

            <p>
                Note: The image file&apos;s name will be used in the game, removing any extensions.
                <br></br>
                E.g. &quot;John_Doe.jpg&quot; will have the name &quot;John Doe&quot; in game.
            </p>
            <button
                className="float-right mx-4 mt-2 px-3 w-fill h-12 text-xl text-neutral-100 font-bold border-b-9 border-x-1 border-blue-600 bg-blue-500 hover:bg-blue-600 hover:border-blue-700 rounded-md cursor-pointer shadow-md text-shadow-xs active:border-none active:translate-y-[1px] active:shadow-2xs  active:inset-shadow-md"
                type="submit"
                disabled={busy}
            >
                {busy ? "Submitting..." : "Submit"}
            </button>
        </form>
    );
};
export default CreateCustomGamePage;
