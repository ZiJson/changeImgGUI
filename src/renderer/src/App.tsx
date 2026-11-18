import { Route, Routes } from 'react-router'
import Layout from './components/Layout'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/query-client'
import { route } from './route'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div id="app" className="h-screen w-screen scrollbar-none overflow-hidden">
        <Layout>
          <Routes>
            {route.map((item) => (
              <Route key={item.title} path={item.url} element={item.element} />
            ))}
          </Routes>
        </Layout>
      </div>
    </QueryClientProvider>
  )
}

export default App
