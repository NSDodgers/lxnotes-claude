import { ColumnDef } from '@tanstack/react-table'
import { FixtureInfo } from '@/types'

/**
 * Formats universe/address for display
 */
function formatUniverseAddress(fixture: FixtureInfo): string {
  if (fixture.universe !== undefined && fixture.address !== undefined) {
    return `${fixture.universe}/${fixture.address}`
  } else if (fixture.universeAddressRaw) {
    return fixture.universeAddressRaw
  } else if (fixture.address !== undefined) {
    return fixture.address.toString()
  }
  return '—'
}

/**
 * Creates column definitions for the fixture data viewer table
 */
export function createFixtureColumns(): ColumnDef<FixtureInfo>[] {
  return [
    {
      accessorKey: 'channel',
      header: 'Ch',
      cell: ({ getValue }) => (
        <span className="font-medium font-mono">{getValue() as number}</span>
      ),
      sortingFn: 'basic',
      enableSorting: true,
      enableMultiSort: true,
      enableResizing: true,
      size: 80,
      minSize: 60,
    },
    {
      accessorKey: 'position',
      header: 'Position',
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue() as string}</span>
      ),
      sortingFn: 'text',
      enableSorting: true,
      enableMultiSort: true,
      enableResizing: true,
      size: 150,
      minSize: 100,
    },
    {
      accessorKey: 'unitNumber',
      header: 'Unit #',
      cell: ({ getValue }) => {
        const value = getValue() as string
        return <span className="text-center">{value || '—'}</span>
      },
      sortingFn: 'text',
      enableSorting: true,
      enableMultiSort: true,
      enableResizing: true,
      size: 80,
      minSize: 60,
    },
    {
      accessorKey: 'fixtureType',
      header: 'Type',
      cell: ({ getValue }) => {
        const value = getValue() as string
        return (
          <div className="max-w-32 truncate" title={value}>
            {value || '—'}
          </div>
        )
      },
      sortingFn: 'text',
      enableSorting: true,
      enableMultiSort: true,
      enableResizing: true,
      size: 150,
      minSize: 100,
    },
    {
      accessorKey: 'purpose',
      header: 'Purpose',
      cell: ({ getValue }) => {
        const value = getValue() as string
        return (
          <div className="max-w-32 truncate" title={value}>
            {value || '—'}
          </div>
        )
      },
      sortingFn: 'text',
      enableSorting: true,
      enableMultiSort: true,
      enableResizing: true,
      size: 150,
      minSize: 100,
    },
    {
      id: 'universeAddress',
      accessorKey: 'universe',
      header: 'U/A',
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {formatUniverseAddress(row.original)}
        </span>
      ),
      sortingFn: 'basic',
      enableSorting: true,
      enableMultiSort: true,
      enableResizing: true,
      size: 100,
      minSize: 80,
    },
  ]
}