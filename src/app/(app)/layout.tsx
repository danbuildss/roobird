import { AppNav } from '@/components/nav/AppNav'
import { CommandPalette } from '@/components/search/CommandPalette'
import { PostComposer } from '@/components/compose/PostComposer'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <AppNav />
      <main style={{ flex: 1, minWidth: 0, overflowX: 'hidden' }}>
        {children}
      </main>
      <CommandPalette />
      <PostComposer />
    </div>
  )
}
