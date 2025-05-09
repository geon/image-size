import { detector } from './detector'
import type { ImageType } from './types/index'
import { typeHandlers } from './types/index'
import type { ISizeCalculationResult } from './types/interface'

type Options = {
  disabledTypes: ImageType[]
}

const globalOptions: Options = {
  disabledTypes: [],
}

/**
 * Return size information based on an Uint8Array
 *
 * @param {Uint8Array} input
 * @returns {ISizeCalculationResult}
 */
export function imageSize(input: Uint8Array): ISizeCalculationResult {
  // detect the file type... don't rely on the extension
  const type = detector(input)

  if (!type) {
    // throw up, if we don't understand the file
    throw new TypeError(`unsupported file type: ${type}`)
  }

  if (globalOptions.disabledTypes.indexOf(type) > -1) {
    throw new TypeError(`disabled file type: ${type}`)
  }

  // find an appropriate handler for this file type
  const result = typeHandlers[type].calculate(input)
  const size = { ...result, type: result.type ?? type }

  // If multiple images, find the largest by area
  if (size.images && size.images.length > 1) {
    const largestImage = size.images.reduce((largest, current) => {
      return current.width * current.height > largest.width * largest.height
        ? current
        : largest
    }, size.images[0])

    // Ensure the main result is the largest image
    size.width = largestImage.width
    size.height = largestImage.height
  }

  return size
}

export const disableTypes = (types: ImageType[]): void => {
  globalOptions.disabledTypes = types
}
