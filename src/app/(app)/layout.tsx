import { AppNav } from '@/components/nav/AppNav'
import { CommandPalette } from '@/components/search/CommandPalette'
import { PostComposer } from '@/components/compose/PostComposer'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <AppNav />
      {/*
        On mobile: AppNav renders a fixed top bar (52px) and fixed bottom nav (60px).
        The main content needs padding to not be hidden under those bars.
      */}
      <main
        style={{ flex: 1, minWidth: 0, overflowX: 'hidden' }}
        className="app-main"
      >
        {children}
      </main>
      <CommandPalette />
      <PostComposer />
      <style>{`
        @media (max-width: 768px) {
          .app-main {
            padding-top: 52px;
            padding-bottom: 60px;
          }
        }
      `}</style>
    </div>
  )
}
