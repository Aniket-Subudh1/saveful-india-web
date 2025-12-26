import { useState, useCallback } from "react"

interface Toast {
  title: string
  description?: string
  variant?: "default" | "destructive"
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback(({ title, description, variant = "default" }: Toast) => {
    const newToast = { title, description, variant }
    setToasts((prev) => [...prev, newToast])

    // Show browser alert for now (can be replaced with a proper toast UI later)
    if (variant === "destructive") {
      alert(`Error: ${title}\n${description || ""}`)
    } else {
      alert(`${title}\n${description || ""}`)
    }

    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t !== newToast))
    }, 3000)
  }, [])

  return { toast, toasts }
}
