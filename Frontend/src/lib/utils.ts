import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Combine Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date to locale string
export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Format date with time
export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Format file size
export function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Generate dummy data for threat stats
export function generateDummyStats(): { [key: string]: number } {
  return {
    malware: Math.floor(Math.random() * 1000),
    phishing: Math.floor(Math.random() * 500),
    ransomware: Math.floor(Math.random() * 200),
    vulnerabilities: Math.floor(Math.random() * 300),
    totalScans: Math.floor(Math.random() * 5000),
    blockedAttacks: Math.floor(Math.random() * 10000),
  };
}

// Get severity color
export function getSeverityColor(severity: 'low' | 'medium' | 'high' | 'critical') {
  switch (severity) {
    case 'low':
      return 'text-info';
    case 'medium':
      return 'text-warning';
    case 'high':
      return 'text-secondary-500';
    case 'critical':
      return 'text-error';
    default:
      return 'text-gray-400';
  }
}

// Get threat type color
export function getThreatTypeColor(type: string) {
  switch (type) {
    case 'malware':
      return 'text-purple-500';
    case 'phishing':
      return 'text-blue-500';
    case 'ransomware':
      return 'text-error';
    case 'vulnerability':
      return 'text-warning';
    case 'exploit':
      return 'text-secondary-500';
    default:
      return 'text-gray-400';
  }
}