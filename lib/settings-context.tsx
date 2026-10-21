'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { getUserSettings, upsertUserSettings, type UserSettings } from '@/lib/supabase-helpers'

type SettingsContextType = {
  settings: UserSettings | null
  loading: boolean
  saveSettings: (s: Omit<UserSettings, 'id'>) => Promise<boolean>
  refetch: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextType>({
  settings: null,
  loading: true,
  saveSettings: async () => false,
  refetch: async () => {},
})

export function useUserSettings() {
  return useContext(SettingsContext)
}

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getUserSettings()
      setSettings(data)
    } catch (err) {
      console.error('Failed to fetch user settings:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const saveSettings = useCallback(async (s: Omit<UserSettings, 'id'>): Promise<boolean> => {
    const result = await upsertUserSettings(s)
    if (result) {
      setSettings(result)
      return true
    }
    return false
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, loading, saveSettings, refetch: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}
