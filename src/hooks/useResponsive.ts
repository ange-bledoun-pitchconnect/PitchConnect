import { useState, useEffect, useCallback } from 'react'

/**
 * useResponsive - Track responsive breakpoints and device capabilities
 * Production-grade hook with comprehensive device detection
 * @returns {Object} Responsive state object with breakpoint information
 */
export const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [isDesktop, setIsDesktop] = useState(true)
  const [breakpoint, setBreakpoint] = useState('desktop')
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  const handleResize = useCallback(() => {
    const width = window.innerWidth

    // Determine breakpoints
    const mobile = width < 640
    const tablet = width >= 640 && width < 1024
    const desktop = width >= 1024

    setIsMobile(mobile)
    setIsTablet(tablet)
    setIsDesktop(desktop)

    // Set breakpoint label
    if (mobile) {
      setBreakpoint('mobile')
    } else if (tablet) {
      setBreakpoint('tablet')
    } else {
      setBreakpoint('desktop')
    }
  }, [])

  const detectTouchDevice = useCallback(() => {
    const hasTouchPoints =
      navigator.maxTouchPoints !== undefined && navigator.maxTouchPoints > 0

    const hasTouchEvent =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window ||
        (window.DocumentTouch && document instanceof window.DocumentTouch))

    const hasMsPointer =
      navigator.msMaxTouchPoints !== undefined &&
      navigator.msMaxTouchPoints > 0

    const isTouch = hasTouchPoints || hasTouchEvent || hasMsPointer

    setIsTouchDevice(isTouch)
  }, [])

  useEffect(() => {
    // Initial detection
    handleResize()
    detectTouchDevice()

    // Add event listener for resize
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [handleResize, detectTouchDevice])

  return {
    isMobile,
    isTablet,
    isDesktop,
    breakpoint,
    isTouchDevice,
  }
}

export default useResponsive
