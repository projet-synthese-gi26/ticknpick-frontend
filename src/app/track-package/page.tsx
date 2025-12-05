import { Suspense } from 'react';
import TrackPackageContent from './TrackContent';
import { Loader2 } from 'lucide-react';

export default function TrackPackagePage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">Chargement du suivi...</p>
          </div>
        </div>
      }
    >
      <TrackPackageContent />
    </Suspense>
  );
}