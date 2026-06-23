import type { NavigateFunction, To } from 'react-router-dom';

export function navigateWithViewTransition(navigate: NavigateFunction, to: To): void {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!document.startViewTransition || prefersReducedMotion) {
    navigate(to);
    return;
  }
  document.startViewTransition(() => {
    navigate(to);
  });
}
