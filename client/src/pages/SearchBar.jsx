import { useState, useEffect, useMemo, useRef } from 'react';
import { useLazyQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { Box, InputBase, alpha, useTheme, useMediaQuery } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { SEARCH_CATALOG } from '../utils/queries';

export const SearchBar = ({ onSearch, autoFocus = false, variant = 'compact' }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  
  // State
  const [isFocused, setIsFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [suggestions, setSuggestions] = useState({ songs: [], artists: [], albums: [] });
  const debounceRef = useRef(null);

  const [fetchSuggestions, { data: suggestionData }] = useLazyQuery(SEARCH_CATALOG, {
    fetchPolicy: 'cache-first',
  });
  
  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  
  // Responsive font sizes based on screen size
  const getResponsiveFontSize = () => {
    if (isMobile) {
      return variant === 'compact' ? '0.85rem' : '0.95rem';
    }
    if (isTablet) {
      return variant === 'compact' ? '1rem' : '1.1rem';
    }
    return variant === 'compact' ? '1.2rem' : '1.3rem';
  };
  
  // Responsive icon sizes
  const getIconSize = () => {
    if (isMobile) return 18;
    if (isTablet) return 20;
    return variant === 'compact' ? 20 : 22;
  };
  
  // Responsive padding
  const getPadding = () => {
    if (isMobile) {
      return { px: 1.5, py: 0.5 };
    }
    if (isTablet) {
      return { px: 1.75, py: 0.625 };
    }
    return { px: 2, py: 0.75 };
  };
  
  // Responsive gap between elements
  const getGap = () => {
    if (isMobile) return 1;
    if (isTablet) return 1.25;
    return 1.5;
  };
  
  // Minimum width based on screen
  const getMinWidth = () => {
    if (isMobile) {
      return variant === 'compact' ? 180 : 220;
    }
    if (isTablet) {
      return variant === 'compact' ? 200 : 260;
    }
    return variant === 'compact' ? 220 : 300;
  };
  
  // Maximum width based on screen
  const getMaxWidth = () => {
    if (isMobile) return 280;
    if (isTablet) return 400;
    return 520;
  };
  
  // Flex basis for different screens
  const getFlexBasis = () => {
    if (isMobile) return '1 1 240px';
    if (isTablet) return '1 1 280px';
    return '1 1 320px';
  };
  
  // Hide keyboard shortcut on mobile
  const showKeyboardShortcut = !isMobile && !searchQuery && !isFocused;

  const hasSuggestionQuery = searchQuery.trim().length >= 2;

  useEffect(() => {
    if (!isFocused || !hasSuggestionQuery) {
      setSuggestions({ songs: [], artists: [], albums: [] });
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions({ variables: { query: searchQuery.trim(), limit: 6 } });
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchSuggestions, hasSuggestionQuery, isFocused, searchQuery]);

  useEffect(() => {
    if (!suggestionData?.searchCatalog) return;
    setSuggestions({
      songs: suggestionData.searchCatalog.songs || [],
      artists: suggestionData.searchCatalog.artists || [],
      albums: suggestionData.searchCatalog.albums || [],
    });
  }, [suggestionData]);

  const totalSuggestions = useMemo(
    () => suggestions.songs.length + suggestions.artists.length + suggestions.albums.length,
    [suggestions]
  );

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 600);
      }, 300);
    }
  }, [autoFocus]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (onSearch) {
        onSearch(searchQuery);
      } else {
        navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      }
      
      // Success animation
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleClick = () => {
    if (variant === 'compact' && !isFocused) {
      navigate('/search');
    }
  };

  const handleSuggestionSelect = (path) => {
    setIsFocused(false);
    navigate(path);
  };

  // Animation styles
  const pulseAnimation = {
    animation: 'pulseGlow 0.6s ease-in-out',
  };

  const floatAnimation = {
    animation: 'float 3s ease-in-out infinite',
  };

  const shimmerAnimation = {
    animation: 'shimmer 2s infinite linear',
  };

  // Define keyframes
  const keyframes = `
    @keyframes pulseGlow {
      0% {
        box-shadow: 0 0 0 0 ${alpha(theme.palette.primary.main, 0.4)};
      }
      70% {
        box-shadow: 0 0 0 ${isMobile ? '4px' : '6px'} ${alpha(theme.palette.primary.main, 0)};
      }
      100% {
        box-shadow: 0 0 0 0 ${alpha(theme.palette.primary.main, 0)};
      }
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-2px);
      }
    }

    @keyframes shimmer {
      0% {
        background-position: -200px 0;
      }
      100% {
        background-position: calc(200px + 100%) 0;
      }
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes borderFlow {
      0% {
        border-image-source: linear-gradient(90deg, transparent, ${theme.palette.primary.main}, transparent);
      }
      100% {
        border-image-source: linear-gradient(270deg, transparent, ${theme.palette.primary.main}, transparent);
      }
    }
  `;

  return (
    <>
      <style>{keyframes}</style>
      <Box
        ref={containerRef}
        sx={{
          position: 'relative',
          maxWidth: getMaxWidth(),
          width: '100%',
          flex: getFlexBasis(),
          animation: 'slideDown 0.3s ease-out',
        }}
      >
        <form onSubmit={handleSearch} style={{ width: '100%' }}>
          <Box
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: getGap(),
              px: getPadding().px,
              py: getPadding().py,
              borderRadius: 999,
              border: `1px solid ${
                isFocused 
                  ? theme.palette.primary.main 
                  : alpha(theme.palette.text.primary, 0.16)
              }`,
              backgroundColor: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(10px)',
              minWidth: getMinWidth(),
              width: '100%',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
              boxShadow: isFocused
                ? `0 4px 20px ${alpha(theme.palette.primary.main, 0.2)}`
                : isHovered
                ? `0 8px 25px ${alpha(theme.palette.primary.main, 0.15)}`
                : 'none',
              ...(isAnimating ? pulseAnimation : {}),
              
              '&:hover': {
                borderColor: theme.palette.primary.main,
              },
              
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
                transition: 'left 0.5s ease',
              },
              
              '&:hover::before': {
                left: '100%',
              },
            }}
          >
            {/* Search Icon with float animation - responsive size */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ...floatAnimation,
            }}>
              <SearchRoundedIcon 
                sx={{ 
                  color: isFocused 
                    ? theme.palette.primary.main 
                    : alpha(theme.palette.text.primary, 0.7),
                  transition: 'color 0.3s ease',
                  fontSize: getIconSize(),
                }} 
              />
            </Box>

            {/* Search Input - responsive typography */}
            <InputBase
              inputRef={inputRef}
              placeholder={isMobile ? "Search music..." : "Search artists, albums, songs..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              sx={{
                flex: 1,
                color: theme.palette.text.primary,
                fontSize: getResponsiveFontSize(),
                fontWeight: isMobile ? 400 : 500,
                '& .MuiInputBase-input': {
                  padding: 0,
                  cursor: 'text',
                  '&::placeholder': {
                    opacity: 0.7,
                    color: alpha(theme.palette.text.primary, 0.7),
                    transition: 'opacity 0.3s ease',
                    fontSize: 'inherit',
                  },
                  '&:focus::placeholder': {
                    opacity: 0.3,
                  },
                },
              }}
            />

            {/* Clear Button with fade animation - responsive size */}
            {searchQuery.length > 0 && (
              <Box
                sx={{
                  animation: 'fadeIn 0.2s ease-out',
                }}
              >
                <Box
                  component="button"
                  type="button"
                  onClick={handleClear}
                  sx={{
                    background: 'none',
                    border: 'none',
                    padding: isMobile ? 0.25 : 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: alpha(theme.palette.text.primary, 0.5),
                    borderRadius: '50%',
                    transition: 'all 0.2s ease',
                    minWidth: isMobile ? 24 : 32,
                    minHeight: isMobile ? 24 : 32,
                    '&:hover': {
                      color: theme.palette.error.main,
                      backgroundColor: alpha(theme.palette.error.main, 0.1),
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  <CloseRoundedIcon sx={{ 
                    fontSize: isMobile ? 16 : 18 
                  }} />
                </Box>
              </Box>
            )}

            {/* Shimmer effect when focused */}
            {isFocused && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `linear-gradient(90deg, 
                    ${alpha(theme.palette.primary.main, 0)} 0%,
                    ${alpha(theme.palette.primary.main, 0.05)} 50%,
                    ${alpha(theme.palette.primary.main, 0)} 100%
                  )`,
                  backgroundSize: '200% 100%',
                  ...shimmerAnimation,
                  borderRadius: 50,
                  zIndex: -1,
                }}
              />
            )}
          </Box>
        </form>

        {/* Suggestions */}
        {isFocused && hasSuggestionQuery && totalSuggestions > 0 && (
          <Box
            onMouseDown={(e) => e.preventDefault()}
            sx={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              zIndex: 20,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              background: alpha(theme.palette.background.paper, 0.95),
              backdropFilter: 'blur(12px)',
              boxShadow: `0 16px 40px ${alpha(theme.palette.common.black, 0.2)}`,
              overflow: 'hidden',
            }}
          >
            <Box sx={{ p: 1.5 }}>
              {suggestions.songs.length > 0 && (
                <Box sx={{ mb: 1.5 }}>
                  <Box sx={{ px: 1, pb: 0.5 }}>
                    <Box sx={{ fontSize: '0.75rem', fontWeight: 700, color: theme.palette.text.secondary }}>
                      Songs
                    </Box>
                  </Box>
                  {suggestions.songs.slice(0, 4).map((song) => {
                    const albumId = song.album?._id;
                    const songId = song._id;
                    const target = albumId ? `/album/${albumId}/${songId}` : `/song/${songId}`;
                    return (
                      <Box
                        key={song._id}
                        onClick={() => handleSuggestionSelect(target)}
                        sx={{
                          px: 1,
                          py: 0.75,
                          borderRadius: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 1,
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.08),
                          },
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Box sx={{ fontSize: '0.9rem', fontWeight: 600 }} noWrap>
                            {song.title}
                          </Box>
                          <Box sx={{ fontSize: '0.75rem', color: theme.palette.text.secondary }} noWrap>
                            {song.artist?.artistAka || 'Unknown Artist'}
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}

              {suggestions.artists.length > 0 && (
                <Box sx={{ mb: suggestions.albums.length ? 1.5 : 0 }}>
                  <Box sx={{ px: 1, pb: 0.5 }}>
                    <Box sx={{ fontSize: '0.75rem', fontWeight: 700, color: theme.palette.text.secondary }}>
                      Artists
                    </Box>
                  </Box>
                  {suggestions.artists.slice(0, 4).map((artist) => (
                    <Box
                      key={artist._id}
                      onClick={() => handleSuggestionSelect(`/artist/${artist._id}`)}
                      sx={{
                        px: 1,
                        py: 0.75,
                        borderRadius: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        },
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Box sx={{ fontSize: '0.9rem', fontWeight: 600 }} noWrap>
                          {artist.artistAka || artist.fullName || 'Unknown Artist'}
                        </Box>
                        <Box sx={{ fontSize: '0.75rem', color: theme.palette.text.secondary }} noWrap>
                          {artist.country || artist.region || 'Africa'}
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}

              {suggestions.albums.length > 0 && (
                <Box>
                  <Box sx={{ px: 1, pb: 0.5 }}>
                    <Box sx={{ fontSize: '0.75rem', fontWeight: 700, color: theme.palette.text.secondary }}>
                      Albums
                    </Box>
                  </Box>
                  {suggestions.albums.slice(0, 4).map((album) => (
                    <Box
                      key={album._id}
                      onClick={() => handleSuggestionSelect(`/album/${album._id}`)}
                      sx={{
                        px: 1,
                        py: 0.75,
                        borderRadius: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        },
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Box sx={{ fontSize: '0.9rem', fontWeight: 600 }} noWrap>
                          {album.title || 'Untitled Album'}
                        </Box>
                        <Box sx={{ fontSize: '0.75rem', color: theme.palette.text.secondary }} noWrap>
                          {album.artist?.artistAka || 'Unknown Artist'}
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* Keyboard shortcut hint - hidden on mobile */}
        {showKeyboardShortcut && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              right: isTablet ? 12 : 16,
              transform: 'translateY(-50%)',
              display: 'flex',
              gap: 0.5,
              opacity: 0.6,
              animation: 'fadeIn 0.5s ease-out',
            }}
          >
            {['⌘', 'K'].map((key, index) => (
              <Box
                key={index}
                sx={{
                  padding: isTablet ? '1px 4px' : '2px 6px',
                  borderRadius: 1,
                  backgroundColor: alpha(theme.palette.text.primary, 0.1),
                  fontSize: isTablet ? '0.7rem' : '0.75rem',
                  fontWeight: 600,
                  color: alpha(theme.palette.text.primary, 0.7),
                  animation: `float 2s ease-in-out infinite ${index * 0.1}s`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    color: theme.palette.primary.main,
                  },
                }}
              >
                {key}
              </Box>
            ))}
          </Box>
        )}

        {/* Active search indicator - hidden on mobile */}
        {isFocused && !isMobile && (
          <Box
            sx={{
              position: 'absolute',
              bottom: -2,
              left: '50%',
              transform: 'translateX(-50%)',
              width: isTablet ? '30%' : '40%',
              height: 2,
              background: `linear-gradient(90deg, 
                transparent, 
                ${theme.palette.primary.main}, 
                transparent
              )`,
              animation: 'borderFlow 2s linear infinite',
            }}
          />
        )}
      </Box>
    </>
  );
};
