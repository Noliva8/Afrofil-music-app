import React, { useState, useEffect } from 'react';
import { eventBus } from '../../utils/Contexts/playerAdapters';

export const AdMediaPlayer = () => {
  const [adState, setAdState] = useState({
    currentAd: null,
    isPlaying: false,
    progress: { currentTime: 0, duration: 0, percent: 0 }
  });

  useEffect(() => {
    const handleAdMetadata = (metadata) => {
      console.log('📱 AdMediaPlayer: Received ad metadata', metadata);
      setAdState(prev => ({ ...prev, currentAd: metadata }));
    };

    const handleAdStart = (adInfo) => {
      console.log('📱 AdMediaPlayer: Ad started', adInfo);
      setAdState(prev => ({ ...prev, isPlaying: true }));
    };

    const handleAdProgress = (progress) => {
      setAdState(prev => ({ ...prev, progress }));
    };

    const handleAdCompleted = () => {
      console.log('📱 AdMediaPlayer: Ad completed');
      setAdState({ 
        currentAd: null, 
        isPlaying: false, 
        progress: { currentTime: 0, duration: 0, percent: 0 } 
      });
    };

    const handleAdError = (errorData) => {
      console.error('📱 AdMediaPlayer: Ad error', errorData);
      setAdState(prev => ({ ...prev, isPlaying: false }));
    };

    // Subscribe to events
    eventBus.on('AD_METADATA_LOADED', handleAdMetadata);
    eventBus.on('AD_STARTED', handleAdStart);
    eventBus.on('AD_PROGRESS', handleAdProgress);
    eventBus.on('AD_COMPLETED', handleAdCompleted);
    eventBus.on('AD_STOPPED', handleAdCompleted);
    eventBus.on('AD_ERROR', handleAdError);

    console.log('📱 AdMediaPlayer: Subscribed to ad events');

    return () => {
      // Cleanup
      eventBus.off('AD_METADATA_LOADED', handleAdMetadata);
      eventBus.off('AD_STARTED', handleAdStart);
      eventBus.off('AD_PROGRESS', handleAdProgress);
      eventBus.off('AD_COMPLETED', handleAdCompleted);
      eventBus.off('AD_STOPPED', handleAdCompleted);
      eventBus.off('AD_ERROR', handleAdError);
      
      console.log('📱 AdMediaPlayer: Unsubscribed from ad events');
    };
  }, []);

  // Helper function to format time
  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  // Destructure for cleaner JSX
  const { currentAd, isPlaying, progress } = adState;

  if (!currentAd) return null;

  return (
    <div className="ad-media-player" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#1a1a1a',
      color: 'white',
      padding: '16px',
      borderTop: '1px solid #333',
      zIndex: 3000
    }}>
      {/* Ad Artwork */}
      {currentAd.artwork && (
        <img 
          src={currentAd.artwork} 
          alt={currentAd.title}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '8px',
            marginRight: '16px',
            float: 'left'
          }}
        />
      )}
      
      {/* Ad Info */}
      <div style={{ overflow: 'hidden' }}>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold' }}>
          {currentAd.title}
        </h3>
        <p style={{ margin: '0 0 4px 0', fontSize: '12px', opacity: 0.8 }}>
          Sponsored by {currentAd.advertiser}
        </p>
        {currentAd.description && (
          <p style={{ margin: '0 0 8px 0', fontSize: '11px', opacity: 0.6 }}>
            {currentAd.description}
          </p>
        )}
      </div>

      {/* Progress Bar */}
      <div style={{ marginTop: '12px' }}>
        <div style={{
          width: '100%',
          height: '4px',
          background: '#333',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div 
            style={{ 
              height: '100%', 
              background: '#1db954',
              width: `${progress.percent}%`,
              transition: 'width 0.25s ease'
            }}
          />
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '11px',
          marginTop: '4px',
          opacity: 0.7
        }}>
          <span>{formatTime(progress.currentTime)}</span>
          <span>{formatTime(progress.duration)}</span>
        </div>
      </div>

      {/* Status and Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '12px'
      }}>
        <div style={{ fontSize: '12px', opacity: 0.8 }}>
          {isPlaying ? '🔴 Now Playing' : '⏸️ Ready to Play'}
        </div>

        {/* Skip Button */}
        <button 
          style={{
            background: 'transparent',
            border: '1px solid #666',
            color: '#666',
            padding: '4px 12px',
            borderRadius: '16px',
            fontSize: '11px',
            cursor: 'not-allowed'
          }}
          disabled
        >
          Skip Ad ({Math.ceil((progress.duration - progress.currentTime) / 1000)}s)
        </button>
      </div>
    </div>
  );
};