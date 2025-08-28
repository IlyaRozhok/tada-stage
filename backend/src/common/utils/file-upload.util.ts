import { diskStorage } from "multer";
import { extname } from "path";
import { BadRequestException } from "@nestjs/common";

// Allowed image file types
const ALLOWED_IMAGE_TYPES = ["jpg", "jpeg", "png", "webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const imageFileFilter = (req: any, file: any, callback: any) => {
  const fileExtension = extname(file.originalname).toLowerCase().slice(1);

  if (!ALLOWED_IMAGE_TYPES.includes(fileExtension)) {
    return callback(
      new BadRequestException(
        "Only image files (jpg, jpeg, png, webp) are allowed"
      ),
      false
    );
  }

  callback(null, true);
};

export const generateFileName = (req: any, file: any, callback: any) => {
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const fileExtension = extname(file.originalname);
  const fileName = `property-${uniqueSuffix}${fileExtension}`;
  callback(null, fileName);
};

export const propertyImageStorage = diskStorage({
  destination: "./uploads/property-images",
  filename: generateFileName,
});

export const imageUploadOptions = {
  storage: propertyImageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10, // Maximum 10 images per property
  },
};

// Helper function to convert file paths to URLs
export const convertFilePathsToUrls = (
  files: Express.Multer.File[],
  baseUrl: string
): string[] => {
  return files.map(
    (file) => `${baseUrl}/uploads/property-images/${file.filename}`
  );
};

// Helper function to extract filenames from URLs
export const extractFilenamesFromUrls = (urls: string[]): string[] => {
  return urls.map((url) => {
    const parts = url.split("/");
    return parts[parts.length - 1];
  });
};
