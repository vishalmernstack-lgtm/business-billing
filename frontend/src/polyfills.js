// Polyfill for crypto.getRandomValues in Node.js environment
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = {}
}

if (typeof globalThis.crypto.getRandomValues === 'undefined') {
  globalThis.crypto.getRandomValues = (array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
    return array
  }
}