import fs from 'node:fs/promises'
import crypto from 'node:crypto'
import zlib from 'node:zlib'
import { promisify } from 'node:util'
const scryptAsync = promisify<string, Buffer, number, crypto.ScryptOptions, unknown>(crypto.scrypt) // add <> to fix overload type error
const brotliCompress = promisify(zlib.brotliCompress)
const brotliDecompress = promisify(zlib.brotliDecompress)

const aes = 'aes-256-gcm'
const aesKeySize = 32
const aesOptions = { N: 16384, r: 8, p: 1 }
const brotliParams =  { [zlib.constants.BROTLI_PARAM_QUALITY]: 1 }

export async function encryptFile(filePath, text, password) {
  const np = password.normalize('NFC')
  const salt = crypto.randomBytes(16)
  const key = (await scryptAsync(np, salt, aesKeySize, aesOptions)) as Buffer

  // Compress the text using Brotli
  const compressedData = await brotliCompress(Buffer.from(text, 'utf8'), { params: brotliParams })

  // Encrypt the data
  const nonce = crypto.randomBytes(12) // generate a unique nonce
  const cipher = crypto.createCipheriv(aes, key, nonce) // create a cipher
  const cipherData = Buffer.concat([cipher.update(compressedData), cipher.final()])

  // Prepend the salt, nonce, authTag, cipher id to the cipherData
  const encryptedData = Buffer
    .concat([salt, nonce, cipher.getAuthTag(), Buffer.from([0x16,0x2,0x82,0x1]), cipherData])

  // Write the encrypted data to the file
  await fs.writeFile(filePath, encryptedData)
}

export async function decryptFile(filePath, password){
  const np = password.normalize('NFC')

  // Read the encrypted file
  const encryptedData = await fs.readFile(filePath)

  // Extract the salt, nonce, auth tag, and cipherText
  const salt = encryptedData.subarray(0, 16)
  const nonce = encryptedData.subarray(16, 28)
  const authTag = encryptedData.subarray(28, 44)
  // 44-48 are reserved for cipher id
  const cipherData = encryptedData.subarray(48)

  const keyBuffer = (await scryptAsync(np, salt, aesKeySize, aesOptions)) as Buffer // derive the key
  const decipher = crypto.createDecipheriv(aes, keyBuffer, nonce)
  decipher.setAuthTag(authTag)

  // Decrypt the cipherData
  const compressedData = Buffer.concat([decipher.update(cipherData), decipher.final()])

  // Decompress the compressedData using Brotli
  const data = await brotliDecompress(compressedData)

  return data.toString('utf8')
}
