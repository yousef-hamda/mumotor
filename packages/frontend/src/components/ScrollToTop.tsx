import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Ensures a page always opens at the top. In a single-page app the browser
 * keeps the previous scroll position across route changes, and its default
 * `scrollRestoration: 'auto'` restores the old offset on reload — so a long
 * template page could open scrolled to the bottom. This resets to the top on
 * every path change (skipping in-page #anchor links, which the browser handles).
 */
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (window.location.hash) return; // let anchor links jump to their target
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
