/**
 * Kenya County Coordinates
 * Approximate centroids for all 47 counties
 * Format: [latitude, longitude]
 */

export type CountyCoordinates = [number, number]

export const KENYA_COUNTIES: Record<string, CountyCoordinates> = {
  // Rift Valley Region
  "Narok": [-1.0833, 35.8667],
  "Nakuru": [-0.3031, 36.0800],
  "Kericho": [-0.3692, 35.2863],
  "Bomet": [-0.7819, 35.3428],
  "Baringo": [0.4919, 35.9631],
  "Uasin Gishu": [0.5144, 35.2697],
  "Elgeyo-Marakwet": [0.9170, 35.5000],
  "Nandi": [0.1833, 35.1500],
  "Trans-Nzoia": [1.0167, 34.9500],
  "West Pokot": [1.6167, 35.1167],
  "Turkana": [3.1167, 35.6000],
  "Samburu": [1.2500, 36.9167],
  "Laikipia": [0.2500, 36.7833],
  "Kajiado": [-1.8500, 36.7833],

  // Central Region
  "Nairobi": [-1.2921, 36.8219],
  "Kiambu": [-1.1714, 36.8356],
  "Nyeri": [-0.4167, 36.9500],
  "Murang'a": [-0.7833, 37.1500],
  "Kirinyaga": [-0.5000, 37.2833],
  "Nyandarua": [-0.1500, 36.4167],

  // Eastern Region
  "Meru": [0.0500, 37.6500],
  "Tharaka-Nithi": [-0.3000, 37.8000],
  "Embu": [-0.5333, 37.4500],
  "Machakos": [-1.5167, 37.2667],
  "Kitui": [-1.3667, 38.0167],
  "Makueni": [-2.2500, 37.6167],
  "Isiolo": [1.3500, 38.4833],
  "Marsabit": [2.3333, 37.9833],

  // Western Region
  "Bungoma": [0.5667, 34.5667],
  "Busia": [0.4633, 34.1117],
  "Kakamega": [0.2833, 34.7500],
  "Vihiga": [0.0833, 34.7000],

  // Nyanza Region
  "Kisumu": [-0.1022, 34.7617],
  "Siaya": [-0.0617, 34.2881],
  "Homa Bay": [-0.5273, 34.4571],
  "Migori": [-1.0634, 34.4731],
  "Kisii": [-0.6817, 34.7667],
  "Nyamira": [-0.5633, 34.9350],

  // Coast Region
  "Mombasa": [-4.0435, 39.6682],
  "Kilifi": [-3.5167, 39.8500],
  "Kwale": [-4.1833, 39.4500],
  "Taita-Taveta": [-3.3167, 38.3667],
  "Tana River": [-1.8000, 40.0333],
  "Lamu": [-2.2686, 40.9019],

  // North Eastern Region
  "Garissa": [-0.4536, 39.6401],
  "Wajir": [1.7475, 40.0573],
  "Mandera": [3.9373, 41.8567],
}

/**
 * Get coordinates for a county, with fallback to Nairobi
 */
export function getCountyCoordinates(county: string): CountyCoordinates {
  // Try exact match first
  if (KENYA_COUNTIES[county]) {
    return KENYA_COUNTIES[county]
  }

  // Try case-insensitive match
  const normalizedCounty = county.toLowerCase().trim()
  for (const [name, coords] of Object.entries(KENYA_COUNTIES)) {
    if (name.toLowerCase() === normalizedCounty) {
      return coords
    }
  }

  // Default to Nairobi if county not found
  console.warn(`County "${county}" not found, defaulting to Nairobi`)
  return KENYA_COUNTIES["Nairobi"]
}

/**
 * Default map center (Kenya)
 */
export const KENYA_CENTER: CountyCoordinates = [-1.2921, 36.8219]
export const DEFAULT_ZOOM = 7
