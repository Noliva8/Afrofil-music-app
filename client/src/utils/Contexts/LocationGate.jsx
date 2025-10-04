
import { useLocationContext } from "./useLocationContext.jsx";



export default function LocationGate({ children, fallback = null }) {
  const { loadingGeo, errorGeo } = useLocationContext();

  if (loadingGeo) return fallback;        
  if (errorGeo) console.warn('Location error:', errorGeo);

  return children;
}
