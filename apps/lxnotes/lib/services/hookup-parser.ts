import Papa from 'papaparse'
import type {
  HookupCSVRow,
  ParsedHookupRow,
  HookupUploadResult,
  ParsedChannelExpression,
  ChannelRange,
  ValidationResult,
  RowError,
  RowErrorType,
  ImportOptions
} from '@/types'

// Header mapping with synonyms
const HEADER_MAPPINGS = {
  lwid: ['LWID', 'LW ID', 'LW_ID', 'Lightwright ID'],
  channel: ['Channel', 'Chan', 'Ch', 'Channel #', 'Channel Number'],
  position: ['Position', 'Pos'],
  unitNumber: ['Unit Number', 'Unit', 'Unit #', 'Unit(#)', 'Unit (#)'],
  fixtureType: ['Fixture Type', 'Type', 'Instrument Type', 'Fixture', 'Instrument'],
  purpose: ['Purpose', 'Purp', 'Use'],
  universeAddress: ['Universe/Address', 'U/A', 'Address', 'DMX Address', 'Universe', 'DMX'],
  positionOrder: ['Position Order', 'Position Sort', 'Pos Order', 'Position Sort Order', 'Sort Order']
}

export class HookupParser {
  /**
   * Parse CSV file and return structured data
   */
  static async parseCSV(file: File): Promise<{
    headers: string[]
    rows: HookupCSVRow[]
    headerMapping: Record<string, string>
  }> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`CSV parsing error: ${results.errors[0].message}`))
            return
          }

          const headers = results.meta.fields || []
          const rows = results.data as HookupCSVRow[]
          const headerMapping = this.detectHeaderMapping(headers)

          resolve({ headers, rows, headerMapping })
        },
        error: (error) => {
          reject(new Error(`Failed to parse CSV: ${error.message}`))
        }
      })
    })
  }

  /**
   * Detect header mapping based on synonyms
   */
  static detectHeaderMapping(headers: string[]): Record<string, string> {
    const mapping: Record<string, string> = {}
    
    for (const [fieldName, synonyms] of Object.entries(HEADER_MAPPINGS)) {
      // Try exact matches first
      const exactMatch = headers.find(header => 
        synonyms.some(synonym => header.toLowerCase() === synonym.toLowerCase())
      )
      
      if (exactMatch) {
        mapping[fieldName] = exactMatch
        continue
      }
      
      // Try partial matches
      const partialMatch = headers.find(header =>
        synonyms.some(synonym => 
          header.toLowerCase().includes(synonym.toLowerCase()) ||
          synonym.toLowerCase().includes(header.toLowerCase())
        )
      )
      
      if (partialMatch) {
        mapping[fieldName] = partialMatch
      }
    }
    
    return mapping
  }

  /**
   * Pre-validate CSV data and return detailed results (async chunked processing)
   */
  static async validateRows(
    rows: HookupCSVRow[],
    headerMapping: Record<string, string>,
    chunkSize: number = 100
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      totalRows: rows.length,
      validRows: 0,
      infrastructureRows: 0,
      errorRows: 0,
      errors: [],
      sampleData: rows.slice(0, 5), // Reduce to 5 rows to save memory
      parsedSamples: []
    }

    const processedLwids = new Set<string>()

    // Process rows in chunks to avoid blocking the main thread
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize)
      
      await new Promise(resolve => {
        // Process chunk synchronously, then yield control
        chunk.forEach((row, chunkIndex) => {
          const index = i + chunkIndex
          const rowNumber = index + 1
          
          try {
            // Extract fields
            const lwid = this.getFieldValue(row, headerMapping, 'lwid')
            const channelStr = this.getFieldValue(row, headerMapping, 'channel')
            
            // Check for infrastructure rows (no channel)
            if (!channelStr) {
              result.infrastructureRows++
              if (index < 5) { // Updated to match reduced sample size
                result.parsedSamples.push(null) // Infrastructure row
              }
              return
            }
            
            let hasError = false
            
            // Check for missing LWID
            if (!lwid) {
              // Limit errors to prevent memory issues
              if (result.errors.length < 1000) {
                result.errors.push({
                  row: rowNumber,
                  type: 'missing_lwid',
                  field: 'lwid',
                  value: '',
                  message: 'Missing Lightwright ID',
                  canSkip: true
                })
              }
              hasError = true
            }
            
            // Check for duplicate LWID
            if (lwid && processedLwids.has(lwid)) {
              if (result.errors.length < 1000) {
                result.errors.push({
                  row: rowNumber,
                  type: 'duplicate_lwid',
                  field: 'lwid',
                  value: lwid,
                  message: `Duplicate Lightwright ID: ${lwid}`,
                  canSkip: true
                })
              }
              hasError = true
            } else if (lwid) {
              processedLwids.add(lwid)
            }
            
            // Check for invalid channel
            const channel = parseInt(channelStr, 10)
            if (isNaN(channel)) {
              if (result.errors.length < 1000) {
                result.errors.push({
                  row: rowNumber,
                  type: 'invalid_channel',
                  field: 'channel',
                  value: channelStr,
                  message: `Invalid channel number: ${channelStr}`,
                  canSkip: true
                })
              }
              hasError = true
            }
            
            if (hasError) {
              result.errorRows++
            } else {
              result.validRows++
            }
            
            // Add to parsed samples if in first 5 rows
            if (index < 5) {
              if (!hasError && lwid && !isNaN(channel)) {
                result.parsedSamples.push(this.parseRow(row, headerMapping, rowNumber))
              } else {
                result.parsedSamples.push(null) // Error row
              }
            }
            
          } catch (error) {
            if (result.errors.length < 1000) {
              result.errors.push({
                row: rowNumber,
                type: 'parsing_error',
                field: 'general',
                value: '',
                message: error instanceof Error ? error.message : 'Unknown parsing error',
                canSkip: true
              })
            }
            result.errorRows++
            
            if (index < 5) {
              result.parsedSamples.push(null) // Error row
            }
          }
        })
        
        // Yield control back to the event loop
        setTimeout(resolve, 0)
      })
    }

    return result
  }

  /**
   * Validate and parse rows with header mapping
   */
  static parseRows(
    rows: HookupCSVRow[],
    headerMapping: Record<string, string>,
    options: ImportOptions = {
      skipInvalidChannels: true,
      skipMissingLwid: true,
      skipDuplicates: true,
      deactivateMissing: true,
      selectedRowsToSkip: []
    }
  ): HookupUploadResult {
    const result: HookupUploadResult = {
      success: true,
      processed: 0,
      inserted: 0,
      updated: 0,
      inactivated: 0,
      skippedInfrastructure: 0,
      errors: [],
      warnings: []
    }

    const parsedRows: ParsedHookupRow[] = []

    rows.forEach((row, index) => {
      const rowNumber = index + 1
      result.processed++
      
      // Skip if explicitly selected to skip
      if (options.selectedRowsToSkip.includes(rowNumber)) {
        return
      }
      
      try {
        const lwid = this.getFieldValue(row, headerMapping, 'lwid')
        const channelStr = this.getFieldValue(row, headerMapping, 'channel')
        
        // Infrastructure row without channel - skip silently
        if (!channelStr) {
          result.skippedInfrastructure++
          return
        }
        
        // Skip missing LWID if option is set
        if (!lwid && options.skipMissingLwid) {
          return
        }
        
        // Skip invalid channels if option is set
        const channel = parseInt(channelStr, 10)
        if (isNaN(channel) && options.skipInvalidChannels) {
          return
        }
        
        const parsedRow = this.parseRow(row, headerMapping, rowNumber)
        if (parsedRow) {
          parsedRows.push(parsedRow)
          result.inserted++
        }
      } catch (error) {
        // If error handling is strict, add to errors, otherwise skip
        if (!options.skipInvalidChannels && !options.skipMissingLwid) {
          result.errors.push({
            row: rowNumber,
            field: 'general',
            message: error instanceof Error ? error.message : 'Unknown parsing error'
          })
          result.success = false
        }
        // Otherwise skip silently
      }
    })

    return result
  }

  /**
   * Parse a single row
   */
  private static parseRow(
    row: HookupCSVRow,
    headerMapping: Record<string, string>,
    rowNumber: number
  ): ParsedHookupRow | null {
    // Extract fields
    const lwid = this.getFieldValue(row, headerMapping, 'lwid')
    const channelStr = this.getFieldValue(row, headerMapping, 'channel')
    
    // Skip rows without channels (infrastructure rows like circuits, power connections)
    if (!channelStr) {
      return null
    }
    
    // Validate required fields for fixture rows
    if (!lwid) {
      throw new Error(`Missing required field: LWID`)
    }

    // Parse channel number
    const channel = parseInt(channelStr, 10)
    if (isNaN(channel)) {
      throw new Error(`Invalid channel number: ${channelStr}`)
    }

    // Extract other fields with defaults
    const position = this.getFieldValue(row, headerMapping, 'position') || ''
    const unitNumber = this.getFieldValue(row, headerMapping, 'unitNumber') || ''
    const fixtureType = this.getFieldValue(row, headerMapping, 'fixtureType') || ''
    const purpose = this.getFieldValue(row, headerMapping, 'purpose') || ''
    const universeAddressRaw = this.getFieldValue(row, headerMapping, 'universeAddress') || ''
    const positionOrderStr = this.getFieldValue(row, headerMapping, 'positionOrder') || ''

    // Parse universe/address
    const { universe, address } = this.parseUniverseAddress(universeAddressRaw)

    // Parse position order (optional field)
    let positionOrder: number | undefined
    if (positionOrderStr) {
      const parsed = parseInt(positionOrderStr, 10)
      if (!isNaN(parsed)) {
        positionOrder = parsed
      }
    }

    return {
      lwid,
      channel,
      position,
      unitNumber,
      fixtureType,
      purpose,
      universeAddressRaw,
      universe,
      address,
      positionOrder
    }
  }

  /**
   * Get field value from row using header mapping
   */
  private static getFieldValue(
    row: HookupCSVRow,
    headerMapping: Record<string, string>,
    fieldName: string
  ): string {
    const headerName = headerMapping[fieldName]
    if (!headerName) return ''
    
    const value = row[headerName]
    return typeof value === 'string' ? value.trim() : ''
  }

  /**
   * Parse universe/address string into components
   */
  private static parseUniverseAddress(raw: string): { universe?: number; address?: number } {
    if (!raw) return {}

    // Try various formats: "1/275", "1-275", "1:275", "275"
    const formats = [
      /^(\d+)[\/\-:](\d+)$/, // Universe/Address format
      /^(\d+)$/ // Address only
    ]

    for (const format of formats) {
      const match = raw.match(format)
      if (match) {
        if (match.length === 3) {
          // Universe/Address format
          return {
            universe: parseInt(match[1], 10),
            address: parseInt(match[2], 10)
          }
        } else if (match.length === 2) {
          // Address only
          return {
            address: parseInt(match[1], 10)
          }
        }
      }
    }

    return {}
  }
}

/**
 * Parse channel expressions like "1-5,21,45,67"
 */
export class ChannelExpressionParser {
  static parse(expression: string): ParsedChannelExpression {
    const result: ParsedChannelExpression = {
      channels: [],
      ranges: [],
      invalid: []
    }

    if (!expression.trim()) return result

    const tokens = expression.split(',').map(t => t.trim()).filter(t => t.length > 0)

    for (const token of tokens) {
      if (token.includes('-')) {
        // Range format like "1-5"
        const parts = token.split('-').map(p => p.trim())
        if (parts.length === 2) {
          const start = parseInt(parts[0], 10)
          const end = parseInt(parts[1], 10)
          
          if (!isNaN(start) && !isNaN(end) && start <= end) {
            result.ranges.push({ start, end })
            // Add individual channels to the channels array too
            for (let i = start; i <= end; i++) {
              if (!result.channels.includes(i)) {
                result.channels.push(i)
              }
            }
          } else {
            result.invalid.push(token)
          }
        } else {
          result.invalid.push(token)
        }
      } else {
        // Single channel
        const channel = parseInt(token, 10)
        if (!isNaN(channel)) {
          if (!result.channels.includes(channel)) {
            result.channels.push(channel)
          }
        } else {
          result.invalid.push(token)
        }
      }
    }

    // Sort channels
    result.channels.sort((a, b) => a - b)

    return result
  }

  /**
   * Format channels back into expression string
   */
  static format(channels: number[]): string {
    if (channels.length === 0) return ''

    const sorted = [...channels].sort((a, b) => a - b)
    const ranges: string[] = []
    let rangeStart = sorted[0]
    let rangeEnd = sorted[0]

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === rangeEnd + 1) {
        // Continue range
        rangeEnd = sorted[i]
      } else {
        // End current range, start new one
        if (rangeStart === rangeEnd) {
          ranges.push(rangeStart.toString())
        } else {
          ranges.push(`${rangeStart}-${rangeEnd}`)
        }
        rangeStart = sorted[i]
        rangeEnd = sorted[i]
      }
    }

    // Add final range
    if (rangeStart === rangeEnd) {
      ranges.push(rangeStart.toString())
    } else {
      ranges.push(`${rangeStart}-${rangeEnd}`)
    }

    return ranges.join(', ')
  }
}