import { UserSettingsProvider } from '@/lib/settings-context'
import { TrackerApp } from '@/components/tracker/tracker-app'

export default function Page() {
  return (
    <UserSettingsProvider>
      <TrackerApp />
    </UserSettingsProvider>
  )
}
