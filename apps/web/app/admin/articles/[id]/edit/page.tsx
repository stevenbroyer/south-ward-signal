'use client';

import { useParams } from 'next/navigation';
import { ArticleEditor } from '@/components/admin/editor/ArticleEditor';

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>();
  return <ArticleEditor mode="edit" articleId={id} />;
}
