import assert from 'node:assert'
import { test, describe } from 'node:test'
import { extractLocationName, reverseGeocodeWithCache } from '../src/lib/geocoding'

describe('Location Utilities', () => {
  test('extractLocationName extracts first non-numeric named part', () => {
    const address = '17 Denison St, Deakin ACT 2600, Australia'
    const name = extractLocationName(address)
    assert.strictEqual(name, 'Deakin ACT 2600')
  })

  test('extractLocationName handles simple place names', () => {
    const address = 'Sydney Opera House, Bennelong Point, Sydney'
    const name = extractLocationName(address)
    assert.strictEqual(name, 'Sydney Opera House')
  })

  test('extractLocationName falls back gracefully for short or numeric addresses', () => {
    const address = '123'
    const name = extractLocationName(address)
    assert.strictEqual(name, '123')
  })

  test('reverseGeocodeWithCache caches coordinate results', async () => {
    const res1 = await reverseGeocodeWithCache(-33.86881, 151.20931)
    const res2 = await reverseGeocodeWithCache(-33.86882, 151.20932)
    assert.deepStrictEqual(res1, res2)
  })
})
