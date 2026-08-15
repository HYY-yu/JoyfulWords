"use client"

import { usePathname } from "next/navigation"

import { FileConverterPageContent } from "@/components/file-converter/file-converter-page-content"
import type { DocumentConversionMode } from "@/lib/api/file-converter/types"
import { useAuth } from "@/lib/auth/auth-context"

interface ToolboxFileConverterPageContentProps {
  mode?: Extract<DocumentConversionMode, "markdown-to-word" | "ppt-to-word">
}

export function ToolboxFileConverterPageContent({
  mode = "markdown-to-word",
}: ToolboxFileConverterPageContentProps) {
  const { user, loading: isAuthLoading } = useAuth()
  const pathname = usePathname()
  const loginHref = `/auth/login?redirect=${encodeURIComponent(pathname || "/")}`

  return (
    <FileConverterPageContent
      variant="toolbox"
      initialMode={mode}
      toolboxAccess={{
        isAuthLoading,
        isSignedIn: Boolean(user),
        loginHref,
      }}
    />
  )
}
