'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, Video, Download, ExternalLink } from 'lucide-react'

interface FileResult {
    resolution: string
    exists: boolean
    url: string | null
}

export default function TranscodePage({ params }: { params: Promise<{ jobId: string }> }) {
    const { jobId } = use(params)
    const [done, setDone] = useState(false)
    const [files, setFiles] = useState<FileResult[]>([])
    const [polling, setPolling] = useState(true)
    const [dots, setDots] = useState('')

    // Animated dots while waiting
    useEffect(() => {
        if (done) return
        const interval = setInterval(() => {
            setDots(d => d.length >= 3 ? '' : d + '.')
        }, 500)
        return () => clearInterval(interval)
    }, [done])

    // Poll every 4 seconds
    useEffect(() => {
        async function checkStatus() {
            try {
                const res = await fetch(`/api/status/${jobId}`)
                const data = await res.json()
                setFiles(data.files)
                if (data.done) {
                    setDone(true)
                    setPolling(false)
                }
            } catch (err) {
                console.error(err)
            }
        }

        checkStatus()
        const interval = setInterval(() => {
            if (!done) checkStatus()
        }, 4000)

        return () => clearInterval(interval)
    }, [jobId, done])

    const resolutionLabels: Record<string, string> = {
        '360p': 'low quality · 360p',
        '480p': 'standard quality · 480p',
        '720p': 'high quality · 720p',
    }

    return (
        <div className="flex items-center justify-center min-h-[80vh] px-4">
            <Card className="w-full max-w-md bg-card border-border">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-medium tracking-tight">
                            transcoding
                        </CardTitle>
                        {done ? (
                            <Badge className="bg-primary/10 text-primary border-0 text-xs font-medium tracking-tight">
                                complete
                            </Badge>
                        ) : (
                            <Badge className="bg-muted text-muted-foreground border-0 text-xs font-medium tracking-tight">
                                processing
                            </Badge>
                        )}
                    </div>
                    <CardDescription className="text-sm text-muted-foreground">
                        {done
                            ? 'your video is ready in all resolutions'
                            : `transcoding your video${dots}`}
                    </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col gap-3">

                    {/* Status indicator */}
                    {!done && (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted border border-border">
                            <Loader2 size={16} className="animate-spin text-primary shrink-0" />
                            <div>
                                <p className="text-sm font-medium tracking-tight">processing on aws fargate</p>
                                <p className="text-xs text-muted-foreground mt-0.5">this usually takes 1–3 minutes</p>
                            </div>
                        </div>
                    )}

                    {done && (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                            <CheckCircle2 size={16} className="text-primary shrink-0" />
                            <p className="text-sm font-medium tracking-tight">all resolutions ready!</p>
                        </div>
                    )}

                    {/* Resolution cards */}
                    <div className="flex flex-col gap-2 mt-1">
                        {['360p', '480p', '720p'].map((res) => {
                            const file = files.find(f => f.resolution === res)
                            const ready = file?.exists ?? false
                            const url = file?.url ?? null

                            return (
                                <div
                                    key={res}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-colors
                                        ${ready ? 'bg-card border-primary/20' : 'bg-muted border-border'}`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Video size={14} className={ready ? 'text-primary' : 'text-muted-foreground'} />
                                        <div>
                                            <p className="text-sm font-medium tracking-tight">{res}</p>
                                            <p className="text-xs text-muted-foreground">{resolutionLabels[res]}</p>
                                        </div>
                                    </div>

                                   <div className="flex items-center gap-2">
                                        {ready && url ? (
                                            <>
                                                <a
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    <ExternalLink size={13} />
                                                </a>

                                                <a
                                                    href={url}
                                                    download
                                                    className="text-muted-foreground hover:text-primary transition-colors"
                                                >
                                                    <Download size={13} />
                                                </a>
                                            </>
                                        ) : (
                                            <Loader2 size={13} className="animate-spin text-muted-foreground" />
                                        )}
                                        </div>
                                </div>
                            )
                        })}
                    </div>

                </CardContent>
            </Card>
        </div>
    )
}