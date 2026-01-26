import { useQuery } from '@tanstack/react-query'
import type { HealthResponse } from '@easy-meal/shared'

function App() {
  const { data, isLoading, error } = useQuery<HealthResponse>({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await fetch('/api/health')
      return res.json()
    },
  })

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Easy Meal</h1>
      <p>Streamline your meal preparation process.</p>

      <div style={{ marginTop: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
        <strong>API Status: </strong>
        {isLoading && <span>Checking...</span>}
        {error && <span style={{ color: 'red' }}>Disconnected</span>}
        {data && <span style={{ color: 'green' }}>{data.status}</span>}
      </div>
    </div>
  )
}

export default App
