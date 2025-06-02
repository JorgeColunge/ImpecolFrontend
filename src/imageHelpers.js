export async function compressImage(file, {
    maxWidth = 720,
    maxHeight = 720,
    quality = 0.7,       // 0-1
    type = 'image/jpeg'   // usa image/webp si quieres WebP
} = {}) {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;

    const scale = Math.min(1, maxWidth / width, maxHeight / height);
    const canvas = new OffscreenCanvas(width * scale, height * scale);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await canvas.convertToBlob({ type, quality });
    return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type });
}