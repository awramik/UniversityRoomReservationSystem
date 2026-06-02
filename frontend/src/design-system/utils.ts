import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// classname function for conditional styles
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
