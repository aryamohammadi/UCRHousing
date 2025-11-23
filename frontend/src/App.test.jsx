import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    // Basic smoke test - just verify the app renders
    expect(document.body).toBeTruthy()
  })

  it('renders header component', () => {
    render(<App />)
    // Check if header/navigation is present
    const header = document.querySelector('header')
    expect(header).toBeTruthy()
  })
})

