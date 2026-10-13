import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const isConfigured = Boolean(
  cloudName &&
  apiKey &&
  apiSecret &&
  !cloudName.includes("your-cloud") &&
  !apiKey.includes("your-cloudinary")
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export async function uploadImageToCloudinary(
  fileBuffer: Buffer,
  folder = "furni_gebeya/avatars"
): Promise<{ success: boolean; url?: string; error?: string }> {
  // If Cloudinary is configured, upload via Cloudinary SDK
  if (isConfigured) {
    try {
      return await new Promise((resolve) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder,
              resource_type: "image",
              transformation: [{ width: 500, height: 500, crop: "fill", gravity: "face" }],
            },
            (error, result) => {
              if (error || !result) {
                console.error("[Cloudinary Upload Error]", error);
                resolve({ success: false, error: error?.message || "Failed to upload to Cloudinary" });
              } else {
                resolve({ success: true, url: result.secure_url });
              }
            }
          )
          .end(fileBuffer);
      });
    } catch (err: any) {
      console.error("[Cloudinary Exception]", err);
      return { success: false, error: err.message };
    }
  }

  // Safe Dev Mode Fallback:
  // Convert buffer to Base64 data URL so the user can test avatar uploads immediately without external Cloudinary setup
  const base64 = `data:image/jpeg;base64,${fileBuffer.toString("base64")}`;
  return {
    success: true,
    url: base64,
  };
}
