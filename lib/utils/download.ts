/**
 * Triggers a browser download for the given content
 * @param content - The file content to download
 * @param filename - The name of the file to download
 * @param mimeType - The MIME type of the file (default: text/csv)
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = 'text/csv;charset=utf-8;'
): void {
  // Create a blob from the content
  const blob = new Blob([content], { type: mimeType })

  // Create a temporary URL for the blob
  const url = window.URL.createObjectURL(blob)

  // Create a temporary anchor element and trigger download
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'

  // Append to body, click, and remove
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up the URL
  window.URL.revokeObjectURL(url)
}

/**
 * Generates a timestamp-based filename for exports
 * @param prefix - The prefix for the filename (e.g., 'script-export')
 * @param extension - The file extension (default: 'csv')
 * @returns A filename like "script-export-2025-10-20-1430.csv"
 */
export function generateExportFilename(
  prefix: string,
  extension: string = 'csv'
): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')

  return `${prefix}-${year}-${month}-${day}-${hours}${minutes}.${extension}`
}
