import Link from 'next/link'
import { ArrowRight, Video } from 'lucide-react'

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
            <div className="mb-6 p-4 rounded-2xl bg-card border border-border">
                <Video size={32} className="text-primary" />
            </div>
            <h1 className="text-4xl font-medium mb-4 leading-tight tracking-tight">
                upload any video,<br />get it transcoded instantly
            </h1>
            <p className="text-muted-foreground text-base mb-8 max-w-md leading-relaxed">
                upload once, we transcode it to 360p, 480p, and 720p — automatically.
            </p>
            <Link href="/upload" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-md text-sm font-medium tracking-tight">
                upload a video
                <ArrowRight size={14} />
            </Link>
        </div>
    )
}