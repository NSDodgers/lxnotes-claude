'use client'

import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface HeaderMappingProps {
  headers: string[]
  headerMapping: Record<string, string>
  onMappingChange: (mapping: Record<string, string>) => void
  onAutoDetect: () => void
}

const REQUIRED_FIELDS = [
  { key: 'lwid', label: 'LWID', required: true },
  { key: 'channel', label: 'Channel', required: true },
  { key: 'position', label: 'Position', required: false },
  { key: 'unitNumber', label: 'Unit Number', required: false },
  { key: 'fixtureType', label: 'Fixture Type', required: false },
  { key: 'purpose', label: 'Purpose', required: false },
  { key: 'universeAddress', label: 'Universe/Address', required: false }
]

export function LightwrightHeaderMapping({
  headers,
  headerMapping,
  onMappingChange,
  onAutoDetect
}: HeaderMappingProps) {
  const handleFieldChange = (fieldKey: string, headerName: string) => {
    const newMapping = { ...headerMapping }
    
    // Remove any existing mapping to this header
    Object.keys(newMapping).forEach(key => {
      if (newMapping[key] === headerName) {
        delete newMapping[key]
      }
    })
    
    // Set new mapping
    if (headerName && headerName !== 'none') {
      newMapping[fieldKey] = headerName
    } else {
      delete newMapping[fieldKey]
    }
    
    onMappingChange(newMapping)
  }

  const isRequiredFieldMapped = (fieldKey: string) => {
    const field = REQUIRED_FIELDS.find(f => f.key === fieldKey)
    return !field?.required || !!headerMapping[fieldKey]
  }

  const getFieldValidation = (fieldKey: string) => {
    const field = REQUIRED_FIELDS.find(f => f.key === fieldKey)
    const isMapped = !!headerMapping[fieldKey]
    
    if (field?.required) {
      return {
        status: isMapped ? 'valid' : 'error',
        icon: isMapped ? CheckCircle : AlertCircle,
        color: isMapped ? 'text-green-600' : 'text-destructive'
      }
    } else {
      return {
        status: isMapped ? 'valid' : 'optional',
        icon: isMapped ? CheckCircle : null,
        color: isMapped ? 'text-green-600' : 'text-muted-foreground'
      }
    }
  }

  const getUsedHeaders = () => {
    return new Set(Object.values(headerMapping))
  }

  const usedHeaders = getUsedHeaders()
  const allRequiredMapped = REQUIRED_FIELDS
    .filter(f => f.required)
    .every(f => !!headerMapping[f.key])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Header Mapping</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onAutoDetect}
          className="flex items-center gap-1"
        >
          <RefreshCw className="h-3 w-3" />
          Auto-detect
        </Button>
      </div>

      {/* Mapping Status */}
      <div className="flex items-center gap-4 p-3 border rounded-lg">
        <div className="flex items-center gap-2">
          {allRequiredMapped ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-destructive" />
          )}
          <span className="text-sm font-medium">
            {allRequiredMapped ? 'Ready to import' : 'Missing required fields'}
          </span>
        </div>
        
        <div className="flex gap-2 text-xs">
          <Badge variant="outline" className="text-green-600">
            {Object.keys(headerMapping).length} mapped
          </Badge>
          <Badge variant="outline" className="text-muted-foreground">
            {headers.length} available
          </Badge>
        </div>
      </div>

      {/* Field Mappings */}
      <div className="grid gap-3">
        {REQUIRED_FIELDS.map((field) => {
          const validation = getFieldValidation(field.key)
          const IconComponent = validation.icon
          
          return (
            <div 
              key={field.key}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex items-center gap-2">
                  {IconComponent && (
                    <IconComponent className={`h-4 w-4 ${validation.color}`} />
                  )}
                  <span className="font-medium text-sm">
                    {field.label}
                  </span>
                  {field.required && (
                    <Badge variant="outline" className="text-xs">
                      Required
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Select
                  value={headerMapping[field.key] || 'none'}
                  onValueChange={(value) => handleFieldChange(field.key, value)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select header..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-muted-foreground">Not mapped</span>
                    </SelectItem>
                    {headers.map((header) => {
                      const isUsed = usedHeaders.has(header) && headerMapping[field.key] !== header
                      return (
                        <SelectItem 
                          key={header} 
                          value={header}
                          disabled={isUsed}
                        >
                          <div className="flex items-center gap-2">
                            <span>{header}</span>
                            {isUsed && (
                              <Badge variant="secondary" className="text-xs">
                                Used
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                
                {headerMapping[field.key] && (
                  <Badge 
                    variant={validation.status === 'valid' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {headerMapping[field.key]}
                  </Badge>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Enhanced Mapping Summary */}
      {Object.keys(headerMapping).length > 0 && (
        <div className="p-3 border rounded-lg bg-muted/30">
          <h4 className="font-medium text-sm mb-2">Mapping Summary</h4>
          <div className="space-y-2 text-xs">
            {REQUIRED_FIELDS.map(field => {
              const isMapped = !!headerMapping[field.key]
              const validation = getFieldValidation(field.key)
              const IconComponent = validation.icon
              
              return (
                <div key={field.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {IconComponent && (
                      <IconComponent className={`h-3 w-3 ${validation.color}`} />
                    )}
                    <span className="font-medium">{field.label}</span>
                    {field.required && (
                      <Badge variant="outline" className="text-xs px-1">
                        Required
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    {isMapped ? (
                      <span className="text-muted-foreground font-mono">
                        {headerMapping[field.key]}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              )
            })}
            
            <div className="pt-2 border-t text-center">
              <div className="flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>{Object.keys(headerMapping).length} mapped</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-orange-600" />
                  <span>{REQUIRED_FIELDS.filter(f => f.required && !headerMapping[f.key]).length} required missing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}