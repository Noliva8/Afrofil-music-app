import { useState, useEffect } from 'react';

export const usePWAInstall = () => {

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined'){
        console.log('type of window is undefined')
        return;
    } 
   

    const handler = (event) => {
      // Prevent the default browser install prompt
      event.preventDefault();
      // Store the event for later use
      setDeferredPrompt(event);
      setIsInstallable(true);
      
      // Optional: Log for debugging
      console.log('PWA install prompt available');
    };

    // Check if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('App is already installed');
        setIsInstallable(false);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      console.log('App was successfully installed');
      setDeferredPrompt(null);
      setIsInstallable(false);
    });

    // Check on initial load
    checkIfInstalled();

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', () => {});
    };
  }, []);

  // Function to trigger the installation
  const triggerInstall = async () => {
    if (!deferredPrompt) {
      console.log('No install prompt available');
      return false;
    }

    try {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond
      const { outcome } = await deferredPrompt.userChoice;
      
      // Clear the deferredPrompt
      setDeferredPrompt(null);
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setIsInstallable(false);
      } else {
        console.log('User dismissed the install prompt');
      }
      
      return outcome === 'accepted';
    } catch (error) {
      console.error('Error triggering install:', error);
      return false;
    }
  };

  return { 
    isInstallable, 
    triggerInstall, 
    installPrompt: deferredPrompt 
  };
};
