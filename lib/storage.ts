'use client'

import { useSyncExternalStore } from 'react'
import { createEmptyDay, EMPTY_APP_DATA, type AppData, type DayLog } from '@/lib/fitness'

function createLocalStore<T>(key: string, initial: T) {
  let cache: T | undefined
  const listeners = new Set<() => void>()

  const read = (): T => {
    if (cache === undefined) {
      try {
        const raw = window.localStorage.getItem(key)
        cache = raw ? (JSON.parse(raw) as T) : initial
      } catch {
        cache = initial
      }
    }
    return cache
  }

  const emit = () => listeners.forEach((l) => l())

  const onStorage = (e: StorageEvent) => {
    if (e.key === key) {
      cache = undefined
      emit()
    }
  }

  const subscribe = (listener: () => void) => {
    if (listeners.size === 0) window.addEventListener('storage', onStorage)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
      if (listeners.size === 0) window.removeEventListener('storage', onStorage)
    }
  }

  const set = (updater: (prev: T) => T): boolean => {
    const next = updater(read())
    try {
      window.localStorage.setItem(key, JSON.stringify(next))
    } catch {
      return false
    }
    cache = next
    emit()
    return true
  }

  const useStore = () => useSyncExternalStore(subscribe, read, () => initial)

  return { useStore, set }
}

const dataStore = createLocalStore<AppData>('gymtrack:data:v1', EMPTY_APP_DATA)

export type PhotoMap = Record<string, string>
const EMPTY_PHOTOS: PhotoMap = {}
const photoStore = createLocalStore<PhotoMap>('gymtrack:photos:v1', EMPTY_PHOTOS)

export const useAppData = dataStore.useStore
export const usePhotos = photoStore.useStore

export function updateDay(key: string, fn: (day: DayLog) => DayLog) {
  return dataStore.set((prev) => ({
    ...prev,
    days: { ...prev.days, [key]: fn(prev.days[key] ?? createEmptyDay()) },
  }))
}

export function setPhoto(key: string, dataUrl: string) {
  return photoStore.set((prev) => ({ ...prev, [key]: dataUrl }))
}

export function removePhoto(key: string) {
  return photoStore.set((prev) => {
    const next = { ...prev }
    delete next[key]
    return next
  })
}

const subscribeNoop = () => () => {}
export function useHydrated() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  )
}

export async function compressImage(file: File, maxSize = 900, quality = 0.72) {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = url
    await img.decode()
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', quality)
  } finally {
    URL.revokeObjectURL(url)
  }
}
