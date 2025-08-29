import { useFetcher } from "react-router";

const CreateCustomGamePage = () => {
    const fetcher = useFetcher();
    const busy = fetcher.state !== "idle";

    return (
        <fetcher.Form
            className="mt-20 w-2/5"
            method="post"
            action="/create-game/new/uploadImageAction"
            encType="multipart/form-data"
        >
            <label htmlFor="custom-game" className="block text-2xl font-bold text-gray-900 ">
                Step 1: Upload your custom photos!
            </label>
            <input id="file-upload" type="file" name="image-upload" accept="image/*" required />
            {/* <div className="mt-2 flex h-100 bg-neutral-100 justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                <div className="text-center">
                    <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        data-slot="icon"
                        aria-hidden="true"
                        className="mx-auto mt-15 size-12 text-gray-300"
                    >
                        <path
                            d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z"
                            clipRule="evenodd"
                            fillRule="evenodd"
                        />
                    </svg>
                    <div className="mt-4 flex text-sm/6 text-gray-600">
                        <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer rounded-md bg-transparent font-semibold text-indigo-600 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-indigo-600 hover:text-indigo-500"
                        >
                            <span>Upload a file</span>
                            <input
                                id="file-upload"
                                type="file"
                                name="file-upload"
                                accept="image/*"
                                className="sr-only"
                            />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs/5 text-gray-600">PNG, JPG, GIF up to 10MB</p>
                </div>
            </div> */}
            <button
                className="float-right mx-4 mt-2 px-3 w-fill h-12 text-xl text-neutral-100 font-bold border-b-9 border-x-1 border-blue-600 bg-blue-500 hover:bg-blue-600 hover:border-blue-700 rounded-md cursor-pointer shadow-md text-shadow-xs active:border-none active:translate-y-[1px] active:shadow-2xs  active:inset-shadow-md"
                type="submit"
                disabled={busy}
            >
                {busy ? "Submitting..." : "Submit"}
            </button>
        </fetcher.Form>
    );
};
export default CreateCustomGamePage;
