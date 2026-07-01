// PIN hashing helpers.
//
// IMPORTANT: this is convenience gating on a shared family device, NOT real
// security. Data and hashes live in the device's IndexedDB and anyone with
// devtools can read/replace them. We store a salted SHA-256 hash instead of the
// raw PIN purely as a courtesy so a casual over-the-shoulder look at the DB
// doesn't reveal PINs.

import { uid } from './id'

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return bufToHex(digest)
}

export async function hashPin(
  pin: string,
): Promise<{ pinHash: string; pinSalt: string }> {
  const pinSalt = uid()
  const pinHash = await sha256Hex(`${pinSalt}:${pin}`)
  return { pinHash, pinSalt }
}

export async function verifyPin(
  pin: string,
  pinHash: string | null,
  pinSalt: string | null,
): Promise<boolean> {
  if (!pinHash || !pinSalt) return true // no PIN set -> always unlocks
  const candidate = await sha256Hex(`${pinSalt}:${pin}`)
  return candidate === pinHash
}
