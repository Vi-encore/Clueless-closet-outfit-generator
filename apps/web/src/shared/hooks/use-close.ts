import { useLocation, useNavigate } from 'react-router';

/**
 * Back where there is a back, and the screen's parent where there is not. A link opened
 * directly has no entry before it, and `navigate(-1)` from there would either do nothing
 * or leave the application altogether. History first, because it keeps what a parent's
 * address alone would lose, such as a filter on the wardrobe.
 */
export function useClose(parent = '/'): () => void {
  const navigate = useNavigate();
  const location = useLocation();

  return () => {
    if (location.key === 'default') {
      void navigate(parent, { replace: true });
    } else {
      void navigate(-1);
    }
  };
}
