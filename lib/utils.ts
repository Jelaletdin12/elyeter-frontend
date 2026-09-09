import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** shadcn'in standart cn() helper'ı — tüm component'lerde className merge için. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
