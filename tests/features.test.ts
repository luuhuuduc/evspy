import assert from 'node:assert'
import { test, describe } from 'node:test'

// Pure calculation helper for testing EV vs petrol savings logic
export function calculateEvSavings(
  annualDistanceKm: number,
  evEfficiencyKwhPer100km: number,
  chargingPricePerKwh: number,
  petrolPricePerLitre: number,
  petrolEfficiencyLitesPer100km: number
) {
  const evKwhPerYear = (annualDistanceKm / 100) * evEfficiencyKwhPer100km
  const evCostPerYear = evKwhPerYear * chargingPricePerKwh
  const evCostPer100km = evEfficiencyKwhPer100km * chargingPricePerKwh

  const petrolLitresPerYear = (annualDistanceKm / 100) * petrolEfficiencyLitesPer100km
  const petrolCostPerYear = petrolLitresPerYear * petrolPricePerLitre
  const petrolCostPer100km = petrolEfficiencyLitesPer100km * petrolPricePerLitre

  const annualSavings = petrolCostPerYear - evCostPerYear
  const co2SavedKg = Math.round(petrolLitresPerYear * 2.31)

  return {
    evCostPerYear,
    petrolCostPerYear,
    evCostPer100km,
    petrolCostPer100km,
    annualSavings,
    co2SavedKg
  }
}

describe('EV Savings Calculator Logic', () => {
  test('calculates correct annual cost and savings for standard inputs', () => {
    const result = calculateEvSavings(15000, 16, 0.45, 1.95, 8.5)
    
    // EV: 150 * 16 = 2400 kWh * 0.45 = $1080
    assert.strictEqual(result.evCostPerYear, 1080)

    // Petrol: 150 * 8.5 = 1275 L * 1.95 = $2486.25
    assert.strictEqual(result.petrolCostPerYear, 2486.25)

    // Savings: 2486.25 - 1080 = $1406.25
    assert.strictEqual(result.annualSavings, 1406.25)

    // CO2: 1275 * 2.31 = 2945.25 => 2945 kg
    assert.strictEqual(result.co2SavedKg, 2945)
  })

  test('cost per 100km is accurately calculated', () => {
    const result = calculateEvSavings(10000, 15, 0.50, 2.00, 10.0)
    assert.strictEqual(result.evCostPer100km, 7.5) // 15 * 0.5
    assert.strictEqual(result.petrolCostPer100km, 20.0) // 10 * 2.0
  })
})
