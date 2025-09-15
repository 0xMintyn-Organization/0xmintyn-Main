// lib/uploadFileToBackend.ts

interface UploadResponse {
  url: string; // The returned URL of uploaded file
}

export const uploadFileToBackend = (
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResponse> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    xhr.open("POST", "https://appbackend.0xmintyn.com/api/v1/upload/upload", true);

    // Track upload progress
    xhr.upload.onprogress = (event) => {
      if (onProgress && event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        resolve({ url: response.url });
      } else {
        reject(new Error("Upload failed with status " + xhr.status));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Upload failed"));
    };

    xhr.send(formData);
  });
};
