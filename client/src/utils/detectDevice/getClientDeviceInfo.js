


export const getClientDeviceInfo = () => {
  try {
    const ua = navigator.userAgent || '';
    const uaData = navigator.userAgentData;
    
    // ==================== MOBILE DETECTION ====================
    let isMobile = false;
    let isTablet = false;
    
    // Modern API (Chromium browsers)
    if (uaData && typeof uaData.mobile === 'boolean') {
      isMobile = uaData.mobile;
    } else {
      // Fallback detection
      const mobileRegex = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobi/i;
      isMobile = mobileRegex.test(ua);
    }

    // ==================== TABLET DETECTION ====================
    // iPad detection (including iPad Pro on MacOS)
    const isIpad = /iPad|Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
    
    // Android tablets and other tablets
    const isAndroidTablet = /Android/.test(ua) && !/Mobile/.test(ua);
    const isOtherTablet = /Tablet|Kindle|Nook|PlayBook|Silk/.test(ua) && !/Mobile/.test(ua);
    
    isTablet = isIpad || isAndroidTablet || isOtherTablet;
    
    // Adjust mobile flag if it's actually a tablet
    if (isTablet) {
      isMobile = false;
    }

    // ==================== PLATFORM DETECTION ====================
    let platform = 'unknown';
    
    // Modern API
    if (uaData?.platform) {
      platform = uaData.platform.toLowerCase();
    } else {
      // Comprehensive platform detection
      if (/Android/i.test(ua)) platform = 'android';
      else if (/iPhone|iPod/i.test(ua)) platform = 'ios';
      else if (/iPad/i.test(ua)) platform = 'ipados';
      else if (/Macintosh|Mac OS|MacPPC|MacIntel|Mac_PowerPC/i.test(ua)) platform = 'macos';
      else if (/Win32|Win64|Windows|WinNT/i.test(ua)) platform = 'windows';
      else if (/Linux/i.test(ua)) platform = 'linux';
      else if (/CrOS/i.test(ua)) platform = 'chromeos';
      else if (/X11/i.test(ua)) platform = 'unix';
    }

    // ==================== BROWSER DETECTION ====================
    let browser = 'unknown';
    let browserVersion = 'unknown';
    
    // Chrome (including iOS Chrome)
    if (/Chrome|CriOS/.test(ua) && !/Edg|OPR/.test(ua)) {
      browser = 'chrome';
      browserVersion = ua.match(/(Chrome|CriOS)\/([0-9.]+)/)?.[2] || 'unknown';
    }
    // Firefox
    else if (/Firefox|FxiOS/.test(ua)) {
      browser = 'firefox';
      browserVersion = ua.match(/Firefox\/([0-9.]+)/)?.[1] || 'unknown';
    }
    // Safari (not Chrome-based)
    else if (/Safari/.test(ua) && !/Chrome|CriOS/.test(ua)) {
      browser = 'safari';
      browserVersion = ua.match(/Version\/([0-9.]+)/)?.[1] || 'unknown';
    }
    // Edge
    else if (/Edg|Edge/.test(ua)) {
      browser = 'edge';
      browserVersion = ua.match(/(Edg|Edge)\/([0-9.]+)/)?.[2] || 'unknown';
    }
    // Opera
    else if (/Opera|OPR/.test(ua)) {
      browser = 'opera';
      browserVersion = ua.match(/(Opera|OPR)\/([0-9.]+)/)?.[2] || 'unknown';
    }
    // Samsung Internet
    else if (/SamsungBrowser/.test(ua)) {
      browser = 'samsung';
      browserVersion = ua.match(/SamsungBrowser\/([0-9.]+)/)?.[1] || 'unknown';
    }

    // ==================== DEVICE TYPE ====================
    const deviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';

    // ==================== ADDITIONAL INFO ====================
    const screenInfo = {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: window.devicePixelRatio || 1,
      colorDepth: window.screen.colorDepth || 24
    };

    const touchInfo = {
      maxTouchPoints: navigator.maxTouchPoints || 0,
      touchEvents: 'ontouchstart' in window,
      pointerEvents: 'onpointerdown' in window
    };

    const connectionInfo = navigator.connection ? {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt
    } : null;

    // ==================== RETURN COMPREHENSIVE DATA ====================
    return {
      // Core device info
      device: deviceType,
      platform: platform,
      browser: browser,
      browserVersion: browserVersion,
      
      // Boolean flags
      isMobile,
      isTablet,
      isDesktop: !isMobile && !isTablet,
      isIpad,
      
      // Capabilities
      capabilities: {
        touch: touchInfo.touchEvents || touchInfo.maxTouchPoints > 0,
        pointer: touchInfo.pointerEvents,
        hover: !isMobile && !isTablet, // Assume hover capability on desktop
        cookies: navigator.cookieEnabled,
        javascript: true,
        localstorage: !!window.localStorage,
        sessionstorage: !!window.sessionStorage
      },
      
      // Technical specs
      screen: screenInfo,
      touch: touchInfo,
      connection: connectionInfo,
      
      // Raw data for debugging
      userAgent: ua,
      languages: navigator.languages || [navigator.language],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      
      // Metadata
      timestamp: Date.now(),
      detectionMethod: uaData ? 'modern' : 'legacy'
    };

  } catch (error) {
    console.error('Device detection failed:', error);
    
    // Minimal fallback
    return {
      device: 'unknown',
      platform: 'unknown',
      browser: 'unknown',
      browserVersion: 'unknown',
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      capabilities: { javascript: true },
      screen: { width: window.innerWidth, height: window.innerHeight },
      userAgent: navigator.userAgent || 'unknown',
      error: error.message,
      timestamp: Date.now(),
      detectionMethod: 'error'
    };
  }
};