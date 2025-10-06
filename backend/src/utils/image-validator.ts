import sharp from "sharp";
import fs from "fs";

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
  width?: number;
  height?: number;
}

export async function validateImage(
  filePath: string
): Promise<ImageValidationResult> {
  try {
    const metadata = await sharp(filePath).metadata();

    const width = metadata.width || 0;
    const height = metadata.height || 0;

    // Check minimum size
    if (width < 100 || height < 100) {
      return {
        isValid: false,
        error: "Image must be at least 100x100 pixels",
        width,
        height,
      };
    }

    // Check maximum size
    if (width > 300 || height > 300) {
      return {
        isValid: false,
        error: "Image must not exceed 300x300 pixels",
        width,
        height,
      };
    }

    return {
      isValid: true,
      width,
      height,
    };
  } catch (error) {
    return {
      isValid: false,
      error: "Invalid image file",
    };
  }
}

export function deleteFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("Error deleting file:", error);
  }
}
