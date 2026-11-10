import { Route, Routes } from 'react-router'
import Layout from './components/Layout'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { route } from './route'
const queryClient = new QueryClient()

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
