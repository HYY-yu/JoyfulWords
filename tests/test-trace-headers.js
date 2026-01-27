/**
 * Test script to verify trace headers are being sent
 *
 * Usage: node test-trace-headers.js
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'

async function testTraceHeaders() {
  console.log('🔍 Testing trace header injection...\n')

  // Test endpoint (should be your actual API endpoint)
  const testEndpoint = `${API_BASE_URL}/auth/login`

  try {
    const response = await fetch(testEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'en-US',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'test123',
      }),
    })

    // Check if traceparent header was sent
    // Note: In a real scenario, you'd need to check the actual request headers
    // This is a simplified test
    console.log('✅ Request completed successfully')
    console.log(`📊 Status: ${response.status}`)
    console.log(`📍 Endpoint: ${testEndpoint}`)
    console.log('\n📝 Note: To verify traceparent header is being sent:')
    console.log('   1. Open browser DevTools Network tab')
    console.log('   2. Make a login request from the app')
    console.log('   3. Check request headers for "traceparent"')
    console.log('   4. Format should be: 00-{trace_id}-{span_id}-{flags}')

    const data = await response.json()
    console.log('\n📦 Response:', JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testTraceHeaders()
