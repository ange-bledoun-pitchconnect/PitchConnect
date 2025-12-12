import { useState, useEffect, useCallback } from 'react'

/**
 * useResponsive - Track responsive breakpoints and device capabilities
 * Production-grade hook with comprehensive device detection for PitchConnect
 * @returns {Object} Responsive state object with complete viewport information
 */
export const useResponsive = () => {
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [isDesktop, setIsDesktop] = useState(true)
  const [breakpoint, setBreakpoint] = useState('desktop')
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  const handleResize = useCallback(() => {
    const newWidth = window.innerWidth
    const newHeight = window.innerHeight

    setWidth(newWidth)
    setHeight(newHeight)

    // Determine breakpoints using Tailwind CSS standards
    const mobile = newWidth < 768
    const tablet = newWidth >= 768 && newWidth < 1024
    const desktop = newWidth >= 1024

    setIsMobile(mobile)
    setIsTablet(tablet)
    setIsDesktop(desktop)

    // Set breakpoint label for responsive layouts
    if (mobile) {
      setBreakpoint('mobile')
    } else if (tablet) {
      setBreakpoint('tablet')
    } else {
      setBreakpoint('desktop')
    }
  }, [])

  const detectTouchDevice = useCallback(() => {
    // Multiple methods to detect touch capability
    const hasTouchPoints =
      navigator.maxTouchPoints !== undefined && navigator.maxTouchPoints > 0

    const hasTouchEvent =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window ||
        (window.DocumentTouch && document instanceof window.DocumentTouch))

    const hasMsPointer =
      navigator.msMaxTouchPoints !== undefined &&
      navigator.msMaxTouchPoints > 0

    // Media query check for touch devices
    const mediaQueryTouch =
      typeof window !== 'undefined' &&
      window.matchMedia('(hover: none) and (pointer: coarse)').matches

    const isTouch = hasTouchPoints || hasTouchEvent || hasMsPointer || mediaQueryTouch

    setIsTouchDevice(isTouch)
  }, [])

  useEffect(() => {
    // Initial detection on mount
    if (typeof window !== 'undefined') {
      handleResize()
      detectTouchDevice()

      // Add event listeners
      window.addEventListener('resize', handleResize)
      window.addEventListener('orientationchange', handleResize)

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('orientationchange', handleResize)
      }
    }
  }, [handleResize, detectTouchDevice])

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    breakpoint,
    isTouchDevice,
  }
}

export default useResponsive
