import * as React from "react";
import { toast as sonnerToast } from "sonner";

type ToastVariant = "default" | "destructive";

export type ToastOptions = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
};

export function toast(options: ToastOptions) {
  const title = options.title ?? "";
  const description = options.description;

  if (options.variant === "destructive") {
    // sonner accepts string/ReactNode; we keep this flexible
    return sonnerToast.error(title as any, { description });
  }

  return sonnerToast(title as any, { description });
}

export function useToast() {
  return React.useMemo(
    () => ({
      toast,
      dismiss: (id?: string | number) => sonnerToast.dismiss(id as any),
    }),
    [],
  );
}

