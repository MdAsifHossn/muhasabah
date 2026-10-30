"use client";

import { toast } from "sonner";
import { ReactNode, useRef } from "react";

import { actionErrorMessage } from "@/lib/action-error";

export function ToastForm({
  action,
  children,
  className,
  successMessage,
}: {
  action: (formData: FormData) => Promise<void>;
  children: ReactNode;
  className?: string;
  successMessage?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    try {
      await action(formData);

      const intent = formData.get("intent");
      if (successMessage) {
        toast.success(successMessage);
      } else if (intent === "submit") {
        toast.success("সফলভাবে জমা দেওয়া হয়েছে!");
      } else if (intent === "draft") {
        toast.success("খসড়া সংরক্ষিত হয়েছে!");
      } else {
        toast.success("সম্পন্ন হয়েছে!");
      }
    } catch (error) {
      toast.error(actionErrorMessage(error, "দুঃখিত, কোনো একটি সমস্যা হয়েছে।"));
    }
  }

  return (
    <form ref={formRef} action={handleSubmit} className={className}>
      {children}
    </form>
  );
}
