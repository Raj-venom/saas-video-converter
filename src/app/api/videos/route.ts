import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()


export async function GET(req: NextRequest) {
    try {
        const videos = await prisma.video.findMany({
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json({ videos }, { status: 200 })

    } catch (error) {
        return NextResponse.json({ error: error }, { status: 500 })
    } finally {
        await prisma.$disconnect()
    }
}