'use client'

import React, { useEffect } from 'react'
import '@/lib/i18n'

interface I18nProviderProps {
  children: React.ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  return <>{children}</>
}
