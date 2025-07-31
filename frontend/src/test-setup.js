import '@testing-library/jest-dom'

// Mock environment variables for testing
const originalEnv = import.meta.env

beforeEach(() => {
  // Reset environment for each test
  import.meta.env = {
    ...originalEnv,
    VITE_API_URL: 'http://localhost:3001/api',
    MODE: 'test'
  }
})

afterEach(() => {
  // Restore original environment
  import.meta.env = originalEnv
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock fetch for API calls
global.fetch = vi.fn()

beforeEach(() => {
  fetch.mockClear()
}) 