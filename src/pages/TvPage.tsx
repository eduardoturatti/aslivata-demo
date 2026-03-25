import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { DisplayView } from '../components/DisplayView';
import { setAdminToken } from '../lib/admin-token';

// Full-screen 1920x1080 broadcast display
// Admin token should be set via /admin login first, then access /tv
export function TvPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Accept token from URL param but immediately clean the URL
    // so credentials don't linger in browser history/address bar
    const adminKey = searchParams.get('admin') || searchParams.get('key');
    if (adminKey) {
      setAdminToken(adminKey);
      // Strip credentials from URL immediately (replace, not push)
      navigate('/tv', { replace: true });
    }
  }, [searchParams, navigate]);

  return <DisplayView broadcast />;
}