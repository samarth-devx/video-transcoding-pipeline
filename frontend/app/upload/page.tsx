'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Upload, FileVideo, Loader2, ArrowRight } from 'lucide-react'

export default function UploadPage() {
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)
    const [file, setFile] = useState<File | null>(null)
    const [dragging, setDragging] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)

    function handleDrop(e: React.DragEvent) {
        e.preventDefault()
        setDragging(false)
        const dropped = e.dataTransfer.files[0]
        if (dropped && dropped.type.startsWith('video/')) {
            setFile(dropped)
        } else {
            toast.error('please drop a video file')
        }
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const selected = e.target.files?.[0]
        if (selected) setFile(selected)
    }

    async function handleUpload() {
    if (!file) return toast.error('please select a video first')
    setUploading(true)
    setProgress(0)

    try {
        // Step 1 — get presigned URL
        const res = await fetch('/api/presign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: file.name, fileType: file.type }),
        })
        const { presignedUrl, key } = await res.json()
        console.log('Presigned URL:', presignedUrl)
        console.log('Key:', key)

        // Step 2 — upload directly to S3 with progress
        await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    setProgress(Math.round((e.loaded / e.total) * 100))
                }
            })
            xhr.addEventListener('load', () => {
                console.log('XHR status:', xhr.status, xhr.responseText)
                if (xhr.status === 200) resolve()
                else reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`))
            })
            xhr.addEventListener('error', (e) => {
                console.error('XHR network error:', e)
                reject(new Error('Network error during upload'))
            })
            xhr.open('PUT', presignedUrl)
            xhr.setRequestHeader('Content-Type', file.type)
            xhr.send(file)
        })

        // Step 3 — redirect to status page
        const encodedKey = Buffer.from(key).toString('base64')
        router.push(`/transcode/${encodedKey}`)

    } catch (err) {
        console.error('Full error:', err)
        toast.error('upload failed, please try again')
        setUploading(false)
        setProgress(0)
    }
}

    return (
        <div className="flex items-center justify-center min-h-[80vh] px-4">
            <Card className="w-full max-w-md bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-base font-medium tracking-tight">upload video</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                        we&apos;ll transcode it to 360p, 480p, and 720p
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">

                    {/* Drop zone */}
                    <div
                        onClick={() => inputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors
                            ${dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'}`}
                    >
                        {file ? (
                            <>
                                <FileVideo size={28} className="text-primary" />
                                <p className="text-sm font-medium tracking-tight">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                            </>
                        ) : (
                            <>
                                <Upload size={28} className="text-muted-foreground" />
                                <p className="text-sm font-medium tracking-tight">drag & drop or click to select</p>
                                <p className="text-xs text-muted-foreground">mp4, mov, avi, mkv supported</p>
                            </>
                        )}
                        <input
                            ref={inputRef}
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>

                    {/* Progress bar */}
                    {uploading && (
                        <div className="flex flex-col gap-2">
                            <div className="w-full bg-muted rounded-full h-1.5">
                                <div
                                    className="bg-primary h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground text-right">{progress}%</p>
                        </div>
                    )}

                    {/* Upload button */}
                    <Button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="w-full font-medium tracking-tight flex items-center gap-2"
                    >
                        {uploading ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                uploading...
                            </>
                        ) : (
                            <>
                                upload & transcode
                                <ArrowRight size={14} />
                            </>
                        )}
                    </Button>

                </CardContent>
            </Card>
        </div>
    )
}