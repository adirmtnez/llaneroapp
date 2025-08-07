import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a unique ID compatible with all environments
 * Alternative to crypto.randomUUID() for Node.js compatibility
 */
export function generateUniqueId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2)}_${Math.random().toString(36).substring(2)}`
}

/**
 * Generate a unique filename with extension
 */
export function generateUniqueFilename(originalName: string, prefix?: string): string {
  const extension = originalName.split('.').pop() || ''
  const baseName = originalName.split('.').slice(0, -1).join('.') || 'file'
  const uniqueId = generateUniqueId()
  
  return prefix ? `${prefix}_${uniqueId}.${extension}` : `${baseName}_${uniqueId}.${extension}`
}
