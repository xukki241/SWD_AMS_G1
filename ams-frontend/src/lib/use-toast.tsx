"use client"

import * as React from "react"
import {
  ToastProvider,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  type ToastActionElement,
} from "@/components/ui/toast"

const TOAST_LIMIT = 4
const TOAST_REMOVE_DELAY = 5000

type ToasterToast = React.ComponentPropsWithoutRef<typeof Toast> & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  variant?: "default" | "destructive" | "success"
  duration?: number
  onOpenChange?: (open: boolean) => void
}

let counter = 0

const genId = () => {
  counter = (counter + 1) % Number.MAX_SAFE_INTEGER
  return counter.toString()
}

type Action =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId: string }

interface State {
  toasts: ToasterToast[]
}

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }
    case "DISMISS_TOAST": {
      if (action.toastId === undefined) {
        return { ...state, toasts: [] }
      }
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toastId ? { ...t, dismiss: true } : t
        ),
      }
    }
    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

export const useToast = () => {
  const [state, dispatch] = React.useReducer(reducer, { toasts: [] })

  const toast = React.useCallback(
    (args: Omit<ToasterToast, "id"> & { id?: string }) => {
      const toastId = args.id ?? genId()

      const dismiss = () => {
        dispatch({ type: "DISMISS_TOAST", toastId })
        setTimeout(() => {
          dispatch({ type: "REMOVE_TOAST", toastId })
        }, 200)
      }

      dispatch({
        type: "ADD_TOAST",
        toast: {
          ...args,
          id: toastId,
          onOpenChange: (open) => {
            if (!open) dismiss()
          },
        },
      })

      const timeout = setTimeout(dismiss, args.duration ?? TOAST_REMOVE_DELAY)
      return { id: toastId, dismiss: () => clearTimeout(timeout) }
    },
    []
  )

  return {
    toasts: state.toasts,
    toast,
  }
}

export const Toaster = () => {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, variant, action, onOpenChange, ...rest }) => (
        <Toast
          key={id}
          variant={variant ?? "default"}
          onOpenChange={onOpenChange}
          {...(rest as object)}
        >
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
    </ToastProvider>
  )
}
