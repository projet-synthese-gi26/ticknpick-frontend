// src/app/(legal)/[slug]/page.tsx
import { legalDocs } from '../legalContent';
import { notFound } from 'next/navigation';
import { FileText, Calendar } from 'lucide-react';
import NavbarHome from '@/components/NavbarHome';
import Footer from '@/components/FooterHome';

export function generateStaticParams() {
  return Object.keys(legalDocs).map((slug) => ({
    slug,
  }));
}

// FIXED: Updated to handle async params in Next.js 15
export default async function LegalPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  // Await the params Promise
  const { slug } = await params;
  const doc = legalDocs[slug];

  if (!doc) {
    notFound();
  }

  const { title, lastUpdated, content: Content } = doc;

  return (
    <div className="bg-slate-50 dark:bg-gray-900 min-h-screen flex flex-col">
        <NavbarHome />
        <main className="flex-grow pt-24 pb-12">
            <div className="max-w-4xl mx-auto px-6 py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-8 mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900/50 rounded-full mb-4">
                        <FileText className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">{title}</h1>
                    <div className="mt-4 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Dernière mise à jour : {lastUpdated}</span>
                    </div>
                </div>

                <article className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 space-y-4">
                    <Content />
                </article>
            </div>
        </main>
        <Footer />
    </div>
  );
}