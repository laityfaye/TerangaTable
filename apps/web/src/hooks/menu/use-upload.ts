'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';

export function useUpload() {
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File, productId?: string): Promise<string> => {
    setLoading(true);
    setError(null);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    const url = productId ? `/products/${productId}/upload-image` : '/uploads/image';

    try {
      const { data } = await apiClient.post<{ data: { url: string } }>(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (evt.total) setProgress(Math.round((evt.loaded * 100) / evt.total));
        },
      });
      setProgress(100);
      return data.data.url;
    } catch (err) {
      setError("Erreur lors de l'upload");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setProgress(0);
    setError(null);
  };

  return { upload, progress, loading, error, reset };
}
