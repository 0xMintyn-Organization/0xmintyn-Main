// // lib/uploadFileToBackend.ts

// interface UploadResponse {
//   url: string; // The returned URL of uploaded file
// }

// export const uploadFileToBackend = (
//   file: File,
//   onProgress?: (progress: number) => void
// ): Promise<UploadResponse> => {
//   return new Promise((resolve, reject) => {
//     const xhr = new XMLHttpRequest();
//     const formData = new FormData();
//     formData.append("file", file);

//     xhr.open("POST", "/api/upload", true);

//     // Track upload progress
//     xhr.upload.onprogress = (event) => {
//       if (onProgress && event.lengthComputable) {
//         const percent = Math.round((event.loaded / event.total) * 100);
//         onProgress(percent);
//       }
//     };

//     xhr.onload = () => {
//       if (xhr.status === 200) {
//         const response = JSON.parse(xhr.responseText);
//         resolve({ url: response.url });
//       } else {
//         reject(new Error("Upload failed with status " + xhr.status));
//       }
//     };

//     xhr.onerror = () => {
//       reject(new Error("Upload failed"));
//     };

//     xhr.send(formData);
//   });
// };

// lib/uploadFileToBackend.ts

interface UploadResponse {
  url: string;
}

export const uploadFileToBackend = (
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResponse> => {
  return new Promise((resolve) => {
    let progress = 0;

    const interval = setInterval(() => {
      progress += 10;

      if (onProgress) {
        onProgress(progress);
      }

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          // Simulate returned URL - replace with actual logic later
          resolve({ url: `https://mockupload.local/videos/${file.name.replace(/\s/g, "_")}` });
        }, 300); // Final delay to simulate processing
      }
    }, 100); // Simulate slow upload
  });
};