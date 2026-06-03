import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import type { BasicInfo, ProjectDetails } from '../api/types'

export interface EditBuffer {
  basicInfo?: Partial<BasicInfo>
  projectDetails?: Partial<ProjectDetails>
}

interface EditBufferContextValue {
  getBuffer: (resourceId: string) => EditBuffer
  setBasicInfoBuffer: (resourceId: string, data: Partial<BasicInfo>) => void
  setProjectDetailsBuffer: (resourceId: string, data: Partial<ProjectDetails>) => void
  clearBuffer: (resourceId: string) => void
}

const EditBufferContext = createContext<EditBufferContextValue | null>(null)

export function EditBufferProvider({ children }: { children: ReactNode }) {
  const [buffers, setBuffers] = useState<Record<string, EditBuffer>>({})

  const getBuffer = useCallback(
    (resourceId: string): EditBuffer => buffers[resourceId] ?? {},
    [buffers],
  )

  const setBasicInfoBuffer = useCallback((resourceId: string, data: Partial<BasicInfo>) => {
    setBuffers((prev) => ({
      ...prev,
      [resourceId]: { ...prev[resourceId], basicInfo: data },
    }))
  }, [])

  const setProjectDetailsBuffer = useCallback(
    (resourceId: string, data: Partial<ProjectDetails>) => {
      setBuffers((prev) => ({
        ...prev,
        [resourceId]: { ...prev[resourceId], projectDetails: data },
      }))
    },
    [],
  )

  const clearBuffer = useCallback((resourceId: string) => {
    setBuffers((prev) => {
      const next = { ...prev }
      delete next[resourceId]
      return next
    })
  }, [])

  return (
    <EditBufferContext.Provider
      value={{ getBuffer, setBasicInfoBuffer, setProjectDetailsBuffer, clearBuffer }}
    >
      {children}
    </EditBufferContext.Provider>
  )
}

export function useEditBuffer() {
  const ctx = useContext(EditBufferContext)
  if (!ctx) throw new Error('useEditBuffer must be used within EditBufferProvider')
  return ctx
}
