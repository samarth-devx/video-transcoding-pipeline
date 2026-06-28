import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3'
import { NextResponse } from 'next/server'

const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
})

const RESOLUTIONS = ['360p', '480p', '720p']
const PRODUCTION_BUCKET = process.env.PRODUCTION_BUCKET!

async function checkFileExists(key: string): Promise<boolean> {
    try {
        await s3.send(new HeadObjectCommand({ Bucket: PRODUCTION_BUCKET, Key: key }))
        return true
    } catch {
        return false
    }
}

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ key: string }> }
) {
    const { key } = await params

    // key comes in as base64 encoded to avoid URL issues
    const decodedKey = Buffer.from(key, 'base64').toString('utf-8')
    const videoId = decodedKey.replace(/\.[^/.]+$/, '')

    const checks = await Promise.all(
        RESOLUTIONS.map(async (res) => {
            const fileKey = `${videoId}/video-${res}.mp4`
            const exists = await checkFileExists(fileKey)
            return {
                resolution: res,
                exists,
                url: exists
                    ? `https://${PRODUCTION_BUCKET}.s3.ap-south-1.amazonaws.com/${fileKey}`
                    : null,
            }
        })
    )

    const allDone = checks.every(c => c.exists)

    return NextResponse.json({ done: allDone, files: checks })
}