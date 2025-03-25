import type { IImage, ISize } from './interface'
import { readUInt32BE, toUTF8String } from './utils'

/**
 * ICNS Header
 *
 * | Offset | Size | Purpose                                                |
 * | 0	    | 4    | Magic literal, must be "icns" (0x69, 0x63, 0x6e, 0x73) |
 * | 4      | 4    | Length of file, in bytes, msb first.                   |
 *
 */
const SIZE_HEADER = 4 + 4 // 8
const FILE_LENGTH_OFFSET = 4 // MSB => BIG ENDIAN

/**
 * Image Entry
 *
 * | Offset | Size | Purpose                                                          |
 * | 0	    | 4    | Icon type, see OSType below.                                     |
 * | 4      | 4    | Length of data, in bytes (including type and length), msb first. |
 * | 8      | n    | Icon data                                                        |
 */
const ENTRY_LENGTH_OFFSET = 4 // MSB => BIG ENDIAN

const ICON_TYPE_SIZE = {
  ICON: 32,
  'ICN#': 32,
  // m => 16 x 16
  'icm#': 16,
  icm4: 16,
  icm8: 16,
  // s => 16 x 16
  'ics#': 16,
  ics4: 16,
  ics8: 16,
  is32: 16,
  s8mk: 16,
  icp4: 16,
  // l => 32 x 32
  icl4: 32,
  icl8: 32,
  il32: 32,
  l8mk: 32,
  icp5: 32,
  ic11: 32,
  // h => 48 x 48
  ich4: 48,
  ich8: 48,
  ih32: 48,
  h8mk: 48,
  // . => 64 x 64
  icp6: 64,
  ic12: 32,
  // t => 128 x 128
  it32: 128,
  t8mk: 128,
  ic07: 128,
  // . => 256 x 256
  ic08: 256,
  ic13: 256,
  // . => 512 x 512
  ic09: 512,
  ic14: 512,
  // . => 1024 x 1024
  ic10: 1024,
}

type IconType = keyof typeof ICON_TYPE_SIZE
function isIconType(iconType: string): iconType is IconType {
  return iconType in ICON_TYPE_SIZE
}
function parseIconType(iconType: string): IconType {
  if (!isIconType(iconType)) {
    throw new Error(`Not a valid ICON_TYPE_SIZE: ${iconType}`)
  }
  return iconType
}

function readImageHeader(
  input: Uint8Array,
  imageOffset: number,
): [IconType, number] {
  const imageLengthOffset = imageOffset + ENTRY_LENGTH_OFFSET
  return [
    parseIconType(toUTF8String(input, imageOffset, imageLengthOffset)),
    readUInt32BE(input, imageLengthOffset),
  ]
}

function getImageSize(type: IconType): ISize {
  const size = ICON_TYPE_SIZE[type]
  return { width: size, height: size, type }
}

export const ICNS: IImage = {
  validate: (input) => toUTF8String(input, 0, 4) === 'icns',

  calculate(input) {
    const inputLength = input.length
    const fileLength = readUInt32BE(input, FILE_LENGTH_OFFSET)
    let imageOffset = SIZE_HEADER

    const images: ISize[] = []

    while (imageOffset < fileLength && imageOffset < inputLength) {
      const imageHeader = readImageHeader(input, imageOffset)
      const imageSize = getImageSize(imageHeader[0])
      images.push(imageSize)
      imageOffset += imageHeader[1]
    }

    if (images.length === 0) {
      throw new TypeError('Invalid ICNS, no sizes found')
    }

    return {
      width: images[0].width,
      height: images[0].height,
      ...(images.length > 1 ? { images } : {}),
    }
  },
}
