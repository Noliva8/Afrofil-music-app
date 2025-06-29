


export async function resizeImageFile(file, size = 1000, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = reject;
    img.onload = () => {
      // draw the center square of the original
      const minEdge = Math.min(img.width, img.height);
      const sx = (img.width - minEdge) / 2;
      const sy = (img.height - minEdge) / 2;

      // target canvas
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      // draw trimmed & scaled into the square canvas
      ctx.drawImage(img,
        sx, sy,               // source x,y
        minEdge, minEdge,     // source w,h
        0, 0,                 // dest x,y
        size, size            // dest w,h
      );

      canvas.toBlob(
        blob => {
          if (!blob) return reject(new Error('Canvas is empty'));
          // preserve original file type if possible
          const newFile = new File([blob], file.name, { type: file.type });
          resolve(newFile);
        },
        file.type,
        quality
      );
    };
    img.src = URL.createObjectURL(file);
  });
}
