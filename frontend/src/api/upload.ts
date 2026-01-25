import client from './client';

export const uploadVideoInChunks = async (
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> => {
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  
  // 1. Initialize upload
  const initRes = await client.post('/upload/video/init', {
    fileName: file.name
  });
  const { uploadId } = initRes.data;

  // 2. Upload chunks
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(file.size, start + CHUNK_SIZE);
    const chunk = file.slice(start, end);

    const formData = new FormData();
    formData.append('file', chunk);
    formData.append('uploadId', uploadId);
    formData.append('index', i.toString());

    await client.post('/upload/video/chunk', formData);
    
    if (onProgress) {
      onProgress(Math.round(((i + 1) / totalChunks) * 100));
    }
  }

  // 3. Complete upload
  const completeRes = await client.post('/upload/video/complete', {
    uploadId,
    fileName: file.name,
    totalChunks
  });

  return completeRes.data.url;
};
