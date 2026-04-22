export async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = String((import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME || '').trim();
  const uploadPreset = String((import.meta as any).env.VITE_CLOUDINARY_UPLOAD_PRESET || '').trim();

  // Helper to read file as Base64 (needed for the deepest fallback)
  const toBase64 = (f: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(f);
    reader.onload = () => {
      const b64 = (reader.result as string).split(',')[1];
      resolve(b64);
    };
    reader.onerror = reject;
  });

  const useXhr = (url: string, data: any, isJson = false): Promise<any> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      
      if (isJson) {
        xhr.setRequestHeader('Content-Type', 'application/json');
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            reject(new Error("Malformed server response"));
          }
        } else {
          try {
            const errData = JSON.parse(xhr.responseText);
            reject(new Error(errData.error?.message || `Server Error ${xhr.status}`));
          } catch (e) {
            reject(new Error(`Network issue (${xhr.status})`));
          }
        }
      };

      xhr.onerror = () => reject(new Error("Connection Filtered: The network dropped the request."));
      xhr.timeout = 180000; // 3 minutes
      xhr.ontimeout = () => reject(new Error("Network Timeout: Connection was too slow."));
      
      xhr.send(isJson ? JSON.stringify(data) : data);
    });
  };

  // 1. DIRECT: Try binary upload to Cloudinary directly
  if (cloudName && uploadPreset) {
    console.log(`[Upload] Step 1: Direct Binary to Cloudinary`);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    
    try {
      const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
      const result = await useXhr(url, formData);
      return result.secure_url;
    } catch (e: any) {
      console.warn("[Upload] Direct failed, moving to Step 2:", e.message);
    }
  }

  // 2. PROXY BINARY: Try binary upload through our server
  console.log(`[Upload] Step 2: Binary Proxy (/api/p)`);
  const proxyForm = new FormData();
  proxyForm.append('file', file);
  
  try {
    const result = await useXhr('/api/p', proxyForm);
    return result.secure_url;
  } catch (e: any) {
    console.warn("[Upload] Proxy binary failed, moving to Step 3 (Base64 Hail Mary):", e.message);
  }

  // 3. PROXY BASE64: The ultimate fallback for restricted mobile carriers/ad-blockers
  // JSON payloads with Base64 often bypass filters that block binary streams.
  console.log(`[Upload] Step 3: Base64 JSON Fallback (/api/b)`);
  try {
    const b64Data = await toBase64(file);
    const result = await useXhr('/api/b', {
      fileData: b64Data,
      fileName: file.name,
      fileType: file.type
    }, true);
    console.log("[Upload] Step 3 SUCCESS!");
    return result.secure_url;
  } catch (e: any) {
    console.error("[Upload] All attempts failed.", e);
    const details = `C:${!!cloudName}, P:${!!uploadPreset}, S:${(file.size / 1024 / 1024).toFixed(2)}MB`;
    throw new Error(`Upload Multi-Failure: The network blocked all 3 methods. This usually means an ad-blocker or mobile data restriction is active. [${details}]`);
  }
}
