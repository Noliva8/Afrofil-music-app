

import { useState, useRef, useCallback } from 'react';

export const useScrollNavigation = () => {
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
    const [showAll, setShowAll] = useState(false);

  const checkScrollPosition = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  const handleWheel = useCallback((e) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  }, []);

  const handleNavClick = useCallback((direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320;
      if (direction === 'left') {
        scrollContainerRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
      
      setTimeout(checkScrollPosition, 300);
    }
  }, [checkScrollPosition]);



const handleShowAll = useCallback(() => {
    setShowAll(!showAll);
  }, [showAll]); 




  return {
    scrollContainerRef,
    showLeftArrow,
    showRightArrow,
    showAll,
    checkScrollPosition,
    handleWheel,
    handleNavClick,
    handleShowAll
  };
};
