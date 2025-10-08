import Pica from "pica";
//IGNORE ALL ESLINT WARNINGS/ERRORS IN THIS FILE PICA DOESN'T HAVE TYPESCRIPT SUPPORT REALLY
/**
 * Resizes an image file using Pica for high quality results
 * @param file - The image file to resize
 * @param maxWidth - Maximum width in pixels (default 224)
 * @param maxHeight - Maximum height in pixels (default 344)
 * @returns Promise resolving to resized File
 */
export const resizeImage = async (file: File, maxWidth = 224, maxHeight = 688): Promise<File> => {
    const pica = new Pica();
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
    const ctx = sourceCanvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");
    ctx.drawImage(img, 0, 0);

    // Create target canvas with new dimensions
    const targetCanvas = document.createElement("canvas");
    targetCanvas.width = width;
    targetCanvas.height = height;

    // Resize with Pica (high quality)
    await pica.resize(sourceCanvas, targetCanvas);

    // Convert to blob then File
    const blob = await pica.toBlob(targetCanvas, file.type);

    // Clean up
    URL.revokeObjectURL(img.src);

    return new File([blob], file.name, {
        type: file.type,
        lastModified: Date.now(),
    });
};

/**
 * Resizes multiple images
 * @param files - Array of image files to resize
 * @param maxWidth - Maximum width in pixels (default 224)
 * @param maxHeight - Maximum height in pixels (default 344)
 * @returns Promise resolving to array of resized Files
 */
export const resizeImages = async (
    files: File[],
    maxWidth = 224,
    maxHeight = 344
): Promise<File[]> => {
    const results = await Promise.all(files.map((file) => resizeImage(file, maxWidth, maxHeight)));
    return results;
};
