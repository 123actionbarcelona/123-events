export const dynamic = 'force-dynamic'
export const revalidate = 0

import { PublicHeader } from '@/components/public/header'
import { PublicFooter } from '@/components/public/footer'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1">
        {children}
      </main>
      <PublicFooter />
    </div>
  )
}