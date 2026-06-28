import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NextResponse } from 'next/server'

const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
})

export async function POST(req: Request) {
    const { fileName, fileType } = await req.json()

    const key = `videos/${Date.now()}-${fileName}`

    const command = new PutObjectCommand({
        Bucket: process.env.SOURCE_BUCKET!,
        Key: key,
        ContentType: fileType,
    })

    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 60 })

    return NextResponse.json({ presignedUrl, key })
}