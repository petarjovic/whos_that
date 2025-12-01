import Pica from "pica";
import { logError } from "./logger.ts";

/**
 * Resizes an image file using Pica for high quality results
 * @param file - The image file to resize
 * @param maxWidth - Maximum width in pixels
 * @param maxHeight - Maximum height in pixels
 * @returns Promise resolving to resized File
 */
export const resizeImage = async (
    file: File,
    maxWidth: number,
    maxHeight: number
): Promise<File> => {
    const pica = new Pica();
    const objectUrl = URL.createObjectURL(file);

    try {
        // Load the image
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image();
            image.onload = () => {
                resolve(image);
            };
            image.onerror = reject;
            image.src = URL.createObjectURL(file);
        });

        // Calculate new dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
        }

        // Create source canvas with original image
        const sourceCanvas = document.createElement("canvas");
        sourceCanvas.width = img.width;
        sourceCanvas.height = img.height;
        const ctxSource = sourceCanvas.getContext("2d");
        if (!ctxSource) throw new Error("Could not get canvas context");
        ctxSource.drawImage(img, 0, 0);

        // Create target canvas with new dimensions
        const targetCanvas = document.createElement("canvas");
        const ctxTarget = targetCanvas.getContext("2d");
        if (!ctxTarget) throw new Error("Could not get canvas context");
        targetCanvas.width = width;
        targetCanvas.height = height;

        // Resize with Pica
        await pica.resize(sourceCanvas, targetCanvas);

        // Convert to blob
        const blob = await pica.toBlob(targetCanvas, file.type);

        // Clean up canvases
        ctxSource.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
        ctxTarget.clearRect(0, 0, targetCanvas.width, targetCanvas.height);

        // Convert blob to file
        return new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
        });
    } catch (error) {
        logError(error);
        // eslint-disable-next-line unicorn/prefer-ternary
        if (error instanceof Error) throw error;
        else throw new Error("Image processing error.");
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
};

/**
 * Resizes multiple images
 * @param files - Array of image files to resize
 * @param maxWidth - Maximum width in pixels
 * @param maxHeight - Maximum height in pixels
 * @returns Promise resolving to array of resized Files
 */
export const resizeImages = async (
    files: File[],
    maxWidth = 450,
    maxHeight = 600
): Promise<PromiseSettledResult<File>[]> => {
    const results = await Promise.allSettled(
        files.map((file) => resizeImage(file, maxWidth, maxHeight))
    );
    return results;
};
