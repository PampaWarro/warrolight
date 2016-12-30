const bitcore = require('bitcore-lib')

export function assert(value: boolean, message: string) {
  if (!value) {
    throw new Error(message)
  }
}

export function sha256(value: string | Uint8Array) {
  return bitcore.crypto.Hash.sha256(
    typeof value === 'string'
    ? new Buffer(value)
    : value
  )
}

export function sign(privateKey: string, value: Uint8Array): Uint8Array {
  return bitcore.crypto.ECDSA.sign(
    value,
    new bitcore.PrivateKey(privateKey)
  ).toBuffer()
}

export function verify(publicKey, signature: Uint8Array, value: Uint8Array): Boolean {
  return bitcore.crypto.ECDSA.verify(
    value,
    bitcore.crypto.Signature.fromBuffer(signature),
    publicKey
  )
}
