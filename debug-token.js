// Ejecutar en consola del navegador para debuggear el token
console.log('=== DEBUG TOKEN ===')

const token = localStorage.getItem('sb-zykwuzuukrmgztpgnbth-auth-token')
console.log('Token raw:', token)

if (token) {
  try {
    const parsed = JSON.parse(token)
    console.log('Token parsed:', parsed)
    console.log('Access token:', parsed?.access_token)
    console.log('Expires at:', new Date(parsed?.expires_at * 1000))
  } catch (e) {
    console.error('Error parsing token:', e)
  }
} else {
  console.log('No token found!')
}

console.log('=== END DEBUG ===')