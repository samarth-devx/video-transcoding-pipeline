const { S3Client, GetObjectCommand, PutObjectCommand} = require("@aws-sdk/client-s3");
const fs = require("node:fs/promises");
const fsOld = require("node:fs")
const path = require("node:path");
const { Readable } = require("node:stream");
const ffmpeg = require("fluent-ffmpeg");

const RESOLUTIONS = [
    { name: "360p", width: 480, height: 360 },
    { name: "480p", width: 858, height: 480 },
    { name: "720p", width: 1280, height: 720 },
];

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const BUCKET_NAME = process.env.BUCKET_NAME;
const KEY = process.env.KEY;

// upload the video
async function init() {
    if (!BUCKET_NAME || !KEY) {
        throw new Error("BUCKET_NAME and KEY env vars are required");
    }
    // Download the original video
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: KEY,
    });
    const result = await s3Client.send(command);

    const originalFilePath = `original-video.mp4`;
    await fs.writeFile(originalFilePath, Readable.from(result.Body));
    const originalVideoPath = path.resolve(originalFilePath)

    const videoId = KEY.replace(/\.[^/.]+$/, "")
    
    const promises = RESOLUTIONS.map((resolution) => {
        const outputFile = `video-${resolution.name}.mp4`;
        const s3Key = `${videoId}/${outputFile}`;

        return new Promise((resolve, reject) => {
        ffmpeg(originalVideoPath)
            .output(outputFile)
            .withVideoCodec("libx264")
            .withAudioCodec("aac")
            .withSize(`${resolution.width}x${resolution.height}`)
            .on("start", () => console.log(`Transcoding started: ${resolution.name}`))            
            .on("end", async () => {
                const putCommand = new PutObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: s3Key,
                    Body: fsOld.createReadStream(path.resolve(outputFile))
                });
                await s3Client.send(putCommand);
                console.log(`Uploaded: ${s3Key}`);
                resolve();
            })
            .on("error", reject) 
            .format("mp4")
            .run();
        });
    });

    await Promise.all(promises);
}

init()