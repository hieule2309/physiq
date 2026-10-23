import { UserSettingsProvider } from '@/lib/settings-context'
import { DailyDataProvider } from '@/lib/daily-data-context'
import { TrackerApp } from '@/components/tracker/tracker-app'

export default function Page() {
  return (
    <UserSettingsProvider>
      <DailyDataProvider>
        <TrackerApp />
      </DailyDataProvider>
    </UserSettingsProvider>
  )
}
