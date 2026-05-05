import { Navigate, useSearchParams } from 'react-router-dom';

/**
 * Legacy redirect — the CV editor lives inline on `/profile` now via the
 * `SplitPaneShell` + `BuilderPanel`. Any external bookmark or older email
 * link that pointed at `/profile/cv/edit?focus=...` lands here and gets
 * forwarded with the same intent encoded as builder-state params.
 */
export default function ProfileCvEditPage() {
  const [params] = useSearchParams();
  const next = new URLSearchParams();
  next.set('builder', '1');
  const focus = params.get('focus');
  if (focus) {
    next.set('focus', focus);
    next.set('coach', '1');
  }
  return <Navigate to={`/profile?${next.toString()}`} replace />;
}
