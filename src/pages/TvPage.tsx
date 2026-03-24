import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { DisplayView } from '../components/DisplayView';
import { setAdminToken } from '../lib/admin-token';

// Full-screen 1920x1080 broadcast display
// Access via /tv?admin=PASSWORD — use this URL in OBS Browser Source
export function TvPage() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const adminKey = searchParams.get('admin') || searchParams.get('key');
    if (adminKey) {
      setAdminToken(adminKey);
      console.log('[TvPage] Admin token set from URL param');
    }
  }, [searchParams]);

  return <DisplayView broadcast />;
}