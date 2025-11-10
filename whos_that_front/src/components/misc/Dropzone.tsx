import { useState } from "react";

/* Dropzone component for image uploads */
const Dropzone = ({ fileHandler }: { fileHandler: (files: FileList) => void }) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const acceptedImageTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/heic",
        "image/heif",
    ];

    const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        fileHandler(e.dataTransfer.files);
    };
    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) fileHandler(e.target.files);
        // Reset input value to allow selecting same files again if needed
        e.target.value = "";
    };

    const handleDragOverAndEnter = (e: React.DragEvent<HTMLDivElement>) => {
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

    return (
        <div
            className="flex w-full items-center justify-center"
            onDrop={handleFileDrop}
            onDragOver={handleDragOverAndEnter}
            onDragEnter={handleDragOverAndEnter}
            onDragLeave={handleDragLeave}
        >
            <label
                htmlFor="file-upload"
                className={`max-2xl:h-70 inset-shadow-xs/25 shadow-2xs/20 h-90 m-2 my-3 flex w-full cursor-pointer flex-col items-center justify-center rounded-lg transition-all duration-200 ${
                    isDragOver ? "bg-blue-100" : "bg-white hover:bg-blue-50"
                }`}
            >
                <div className="flex flex-col items-center justify-center pb-6 pt-5">
                    <svg
                        className={`h-17 max-2xl:h-13 max-2xl:w-13 mb-4 w-20 transition-colors duration-200 ${
                            isDragOver ? "text-blue-400" : "text-gray-300"
                        }`}
                        aria-hidden="true"
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
                        className={`mb-2 transition-colors duration-200 ${
                            isDragOver
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-gray-500 dark:text-gray-400"
                        }`}
                    >
                        <span
                            className={`text-base font-semibold hover:underline max-2xl:text-sm ${
                                isDragOver ? "text-blue-600" : "text-blue-500"
                            }`}
                        >
                            {isDragOver ? "Drop images here" : "Click to upload"}
                        </span>{" "}
                        {!isDragOver && "or drag and drop"}
                    </p>
                    <p
                        className={`text-center text-sm transition-colors duration-200 max-2xl:text-xs ${
                            isDragOver
                                ? "text-blue-500 dark:text-blue-400"
                                : "text-gray-500 dark:text-gray-400"
                        }`}
                    >
                        JPG, PNG, or HEIC
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
    );
};
export default Dropzone;
