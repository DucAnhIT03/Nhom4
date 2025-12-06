import { v2 as cloudinary, UploadApiOptions, UploadApiResponse } from "cloudinary";

// Function to get Cloudinary config
const getCloudinaryConfig = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  return {
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  };
};

// Initialize Cloudinary config
const config = getCloudinaryConfig();
if (!config) {
  console.warn(
    "⚠️  Cloudinary chưa được cấu hình. Vui lòng thêm các biến môi trường sau vào file .env:\n" +
    "CLOUDINARY_CLOUD_NAME=your_cloud_name\n" +
    "CLOUDINARY_API_KEY=your_api_key\n" +
    "CLOUDINARY_API_SECRET=your_api_secret\n" +
    "Upload file sẽ không hoạt động cho đến khi cấu hình xong."
  );
} else {
  cloudinary.config(config);
  console.log("✅ Cloudinary đã được cấu hình thành công");
}

export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
}

export const uploadToCloudinary = async (
  file: UploadedFile,
  options: UploadApiOptions = {},
): Promise<CloudinaryUploadResult> => {
  // Check if Cloudinary is configured
  const config = getCloudinaryConfig();
  if (!config) {
    throw new Error(
      "Cloudinary chưa được cấu hình. Vui lòng thêm CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, và CLOUDINARY_API_SECRET vào file .env"
    );
  }

  // Ensure config is set (in case it wasn't set at module load)
  if (!cloudinary.config().api_key) {
    cloudinary.config(config);
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "music-app", resource_type: "image", ...options },
      (error, result?: UploadApiResponse) => {
        if (error || !result) {
          return reject(error);
        }
        resolve({
          publicId: result.public_id,
          url: result.secure_url,
        });
      },
    );

    uploadStream.end(file.buffer);
  });
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  // Check if Cloudinary is configured
  const config = getCloudinaryConfig();
  if (!config) {
    throw new Error(
      "Cloudinary chưa được cấu hình. Vui lòng thêm CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, và CLOUDINARY_API_SECRET vào file .env"
    );
  }

  // Ensure config is set (in case it wasn't set at module load)
  if (!cloudinary.config().api_key) {
    cloudinary.config(config);
  }

  await cloudinary.uploader.destroy(publicId);
};


