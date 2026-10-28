import { Route, Routes } from 'react-router'
import Layout from './components/Layout'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { route } from './route'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-screen w-screen scrollbar-thin scrollbar-thumb-stone-500 scrollbar-track-stone-200 overflow-hidden dark:scrollbar-thumb-neutral-500 dark:scrollbar-track-neutral-800">
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
