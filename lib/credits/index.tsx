'use client'

import { useEffect } from 'react'
import { InsufficientCreditsProvider, useInsufficientCredits } from './insufficient-credits-context'
import { InsufficientCreditsDialog } from '@/components/credits/insufficient-credits-dialog'
import {
  registerInsufficientCreditsCallback,
  unregisterInsufficientCreditsCallback,
} from './insufficient-credits-dialog-handler'

export function InsufficientCreditsRoot(props: { children: React.ReactNode }) {
  return (
    <InsufficientCreditsProvider>
      <InsufficientCreditsWrapper>{props.children}</InsufficientCreditsWrapper>
    </InsufficientCreditsProvider>
  )
}

function InsufficientCreditsWrapper(props: { children: React.ReactNode }) {
  const { showInsufficientCredits } = useInsufficientCredits()

  useEffect(() => {
    registerInsufficientCreditsCallback(showInsufficientCredits)
    return () => {
      unregisterInsufficientCreditsCallback()
    }
  }, [showInsufficientCredits])

  return (
    <>
      {props.children}
      <InsufficientCreditsDialogContent />
    </>
  )
}

function InsufficientCreditsDialogContent() {
  const { isOpen, data, hideInsufficientCredits } = useInsufficientCredits()

  return (
    <InsufficientCreditsDialog
      open={isOpen}
      onOpenChange={hideInsufficientCredits}
      data={data}
    />
  )
}

export { InsufficientCreditsProvider, useInsufficientCredits } from './insufficient-credits-context'
export { InsufficientCreditsDialog } from '@/components/credits/insufficient-credits-dialog'
export type { InsufficientCreditsData } from '@/components/credits/insufficient-credits-dialog'
