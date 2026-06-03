"use client";

import { useForm } from "react-hook-form";

export type FormValues = {
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
};

export function useRoomForm() {
  return useForm<FormValues>();
}
