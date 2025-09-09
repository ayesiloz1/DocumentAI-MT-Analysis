import { useEffect, useState } from 'react';

interface NoSSRProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * NoSSR component prevents hydration mismatches by only rendering
 * children on the client side after hydration is complete.
 * This helps avoid issues with browser extensions that modify the DOM.
 */
const NoSSR: React.FC<NoSSRProps> = ({ children, fallback = null }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return fallback as React.ReactElement;
  }

  return <>{children}</>;
};

export default NoSSR;
