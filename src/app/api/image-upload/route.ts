import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary';
import { auth } from "@clerk/nextjs/server";

// Configuration
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

interface cloudinaryUploadResponse {
    public_id: string;
    [key: string]: any;
}

export async function POST(request: NextRequest) {

    const { userId } = auth()

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const formData = await request.formData()
        const file = formData.get("file") as File | null

        if (!file) {
            return NextResponse.json({ error: 'File not found' }, { status: 400 })
        }

        const bytes = await file.arrayBuffer() // Convert file to bytes
        const buffer = Buffer.from(bytes) // Convert bytes to buffer

        const reesponse = await new Promise<cloudinaryUploadResponse>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: "saas-video" },
                (error, result) => {
                    if (error) reject(error)
                    else resolve(result as cloudinaryUploadResponse)
                }
            )
            uploadStream.end(buffer)
        })

        return NextResponse.json(
            {
                public_id: reesponse.public_id
            },
            { status: 200 }
        )


    } catch (error) {
        console.log("UPload image failed", error)
        return NextResponse.json({ error: "Upload image failed" }, { status: 500 })
    }
}