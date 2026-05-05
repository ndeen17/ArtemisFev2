import { Navigate, useParams } from 'react-router-dom';

/**
 * Legacy redirect — targeted-CV editing lives inline on the CV review page
 * via the `SplitPaneShell` + `BuilderPanel`. External bookmarks and older
 * deep links pointing at `/applications/:id/targeted-cv/edit` are forwarded
 * to `/applications/:id/cv-review?builder=1`.
 */
export default function TargetedCvEditPage() {
  const { id = '' } = useParams<{ id: string }>();
  return <Navigate to={`/applications/${id}/cv-review?builder=1`} replace />;
}