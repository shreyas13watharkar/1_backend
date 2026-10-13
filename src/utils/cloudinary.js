
import { v2 as cloudinary } from "cloudinary";
import fs from "node:fs/promises";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    if (!localFilePath) return null;

    try {
        console.log("Uploading file to Cloudinary:", localFilePath);
        console.log("Cloud name configured:", Boolean(process.env.CLOUDINARY_CLOUD_NAME));
        console.log("API key configured:", Boolean(process.env.CLOUDINARY_API_KEY));
        console.log("API secret configured:", Boolean(process.env.CLOUDINARY_API_SECRET));

        const response = await cloudinary.uploader.upload(
            localFilePath,
            { resource_type: "auto" }
        );

        console.log("Cloudinary upload successful:", response.secure_url);
        return response;

    } catch (error) {
        console.error("Cloudinary upload failed:", {
            message: error.message,
            http_code: error.http_code,
            name: error.name
        });

        return null;

    } finally {
        try {
            await fs.unlink(localFilePath);
            console.log("Temporary file deleted:", localFilePath);
        } catch (error) {
            if (error.code !== "ENOENT") {
                console.error("Temporary file cleanup failed:", error.message);
            }
        }
    }
};

export { uploadOnCloudinary };
