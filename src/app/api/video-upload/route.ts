import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();


// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

interface cloudinaryUploadResponse {
    public_id: string;
    bytes: number;
    duration?: number;
    [key: string]: any;
}


export async function POST(request: NextRequest) {
    // Check if user is authenticated
    // If not, return 401 Unauthorized
    // validate  forrm data
    // upload video to cloudinary
    // if sucessfully uploaded to cloudinary
    // save meta data to database
    // return success response
    // if any error, return error response

    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (
            !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
            !process.env.CLOUDINARY_API_KEY ||
            !process.env.CLOUDINARY_API_SECRET
        ) {
            return NextResponse.json({ error: "Cloudinary credentials not found" }, { status: 500 })
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const originalSize = formData.get('originalSize') as string;

        if (!file) {
            return NextResponse.json({ error: 'No file found' }, { status: 400 });
        }

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        if (!description) {
            return NextResponse.json({ error: 'Description is required' }, { status: 400 });
        }

        if (!originalSize) {
            return NextResponse.json({ error: 'Original size is required' }, { status: 400 });
        }


        const bytes = await file.arrayBuffer(); // Convert file to bytes
        const buffer = Buffer.from(bytes); // Convert bytes to buffer

        // Upload video to cloudinary
        const response = await new Promise<cloudinaryUploadResponse>((resolve, reject) => {

            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'video',
                    folder: "saas-video",
                    transformation: [
                        {
                            quality: "auto",
                            fetch_format: 'mp4'
                        }
                    ]
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result as cloudinaryUploadResponse);
                }

            )
            uploadStream.end(buffer);
        });

        // Save video meta data to database
        const video = await prisma.video.create({
            data: {
                title,
                description,
                originalSize,
                publicId: response.public_id,
                compressedSize: String(response.bytes),
                duration: response.duration || 0,
            }
        })

        return NextResponse.json({ video }, { status: 200 });

    } catch (error) {
        console.log('Upload video failed', error);
        return NextResponse.json({ error: 'Upload video failed' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}