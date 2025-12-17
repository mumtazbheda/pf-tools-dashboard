import { NextRequest, NextResponse } from "next/server";

// AWS S3 Configuration - MUST be set in environment variables
const AWS_CONFIG = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  region: process.env.AWS_REGION || "us-east-1",
  bucket: process.env.S3_BUCKET_NAME || "gala-home-property-images",
  cloudfrontDomain: process.env.CLOUDFRONT_DOMAIN || "d1g4mqni3902xv.cloudfront.net",
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const images = formData.getAll("images") as File[];
    const location = formData.get("location") as string;

    if (!images || images.length === 0) {
      return NextResponse.json(
        { success: false, message: "No images provided" },
        { status: 400 }
      );
    }

    if (!location) {
      return NextResponse.json(
        { success: false, message: "Location is required" },
        { status: 400 }
      );
    }

    const uploadedImages = [];

    for (const image of images) {
      try {
        // Generate unique filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substr(2, 9);
        const extension = image.name.split(".").pop() || "jpg";
        const sanitizedLocation = location.toLowerCase().replace(/\s+/g, "-");
        const filename = `${sanitizedLocation}/${timestamp}-${randomStr}.${extension}`;

        // In production, this would upload to S3 using AWS SDK
        // For demonstration, we simulate the upload
        const s3Url = `https://${AWS_CONFIG.bucket}.s3.${AWS_CONFIG.region}.amazonaws.com/${filename}`;
        const cloudfrontUrl = `https://${AWS_CONFIG.cloudfrontDomain}/${filename}`;

        uploadedImages.push({
          id: `img-${timestamp}-${randomStr}`,
          name: image.name,
          s3Url,
          cloudfrontUrl,
          location,
          uploadedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error(`Failed to upload ${image.name}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Uploaded ${uploadedImages.length} images`,
      images: uploadedImages,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to upload images" },
      { status: 500 }
    );
  }
}
