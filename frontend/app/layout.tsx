import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import Link from 'next/link'
import { Video } from 'lucide-react'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
    title: 'VideoFlow',
    description: 'Upload and transcode videos instantly',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={`${geist.variable} ${geistMono.variable}`}>
                <nav className="border-b border-border h-13 flex items-center justify-between px-6">
                    <Link href="/" className="font-medium text-sm flex items-center gap-2 tracking-tight">
                        <Video size={15} />
                        videoflow
                    </Link>
                </nav>
                <main>{children}</main>
                <Toaster />
            </body>
        </html>
    )
}