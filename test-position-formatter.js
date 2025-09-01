// Quick test script to verify position/unit formatting
import { PositionUnitFormatter } from './lib/services/lightwright-parser.ts'

// Test data scenarios
const testScenarios = [
  // Single position with consecutive units
  {
    name: 'Single position, consecutive units',
    fixtures: [
      { position: 'DECK', unitNumber: '1' },
      { position: 'DECK', unitNumber: '2' },
      { position: 'DECK', unitNumber: '3' },
      { position: 'DECK', unitNumber: '4' },
      { position: 'DECK', unitNumber: '5' },
    ],
    expected: 'DECK: #s 1-5'
  },
  
  // Single position with non-consecutive units  
  {
    name: 'Single position, non-consecutive units',
    fixtures: [
      { position: '1E', unitNumber: '1' },
      { position: '1E', unitNumber: '3' },
      { position: '1E', unitNumber: '7' },
      { position: '1E', unitNumber: '8' },
      { position: '1E', unitNumber: '9' },
    ],
    expected: '1E: #s 1, 3, 7-9'
  },
  
  // Multiple positions
  {
    name: 'Multiple positions',
    fixtures: [
      { position: '1E', unitNumber: '11' },
      { position: 'APRON TRUSS DS', unitNumber: '6' },
      { position: 'BOX BOOM SR', unitNumber: '1' },
    ],
    expected: '1E #11\nAPRON TRUSS DS #6\nBOX BOOM SR #1'
  },
  
  // Single unit (should not have ": #s")
  {
    name: 'Single unit',
    fixtures: [
      { position: 'BOX BOOM SR', unitNumber: '1' }
    ],
    expected: 'BOX BOOM SR #1'
  },
  
  // Test with APRON TRUSS DS data from sample (units 6,5,4,3,2,1)
  {
    name: 'APRON TRUSS DS from sample data',
    fixtures: [
      { position: 'APRON TRUSS DS', unitNumber: '6' },
      { position: 'APRON TRUSS DS', unitNumber: '5' },
      { position: 'APRON TRUSS DS', unitNumber: '4' },
      { position: 'APRON TRUSS DS', unitNumber: '3' },
      { position: 'APRON TRUSS DS', unitNumber: '2' },
      { position: 'APRON TRUSS DS', unitNumber: '1' },
    ],
    expected: 'APRON TRUSS DS: #s 1-6'
  }
]

console.log('Testing PositionUnitFormatter...\n')

testScenarios.forEach((scenario, index) => {
  console.log(`Test ${index + 1}: ${scenario.name}`)
  const result = PositionUnitFormatter.formatPositionUnits(scenario.fixtures)
  console.log(`  Input: ${JSON.stringify(scenario.fixtures.map(f => `${f.position} #${f.unitNumber}`).join(', '))}`)
  console.log(`  Expected: ${scenario.expected}`)
  console.log(`  Result:   ${result}`)
  console.log(`  Status:   ${result === scenario.expected ? '✅ PASS' : '❌ FAIL'}`)
  console.log()
})