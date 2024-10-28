const handleImageUpload = async (coverImage, uploadDir, artistId) => {
  // Ensure the uploads directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Uploads directory created!');
  }

  const { createReadStream, filename, mimetype } = await coverImage;
  
  // Validate the file type
  const validImageTypes = ['image/jpeg', 'image/png'];
  if (!validImageTypes.includes(mimetype)) {
    throw new Error('Invalid file type. Only JPEG and PNG are allowed.');
  }

  // Create a unique filename using the artistId and timestamp
  const uniqueFilename = `artistCoverImage_${artistId || 'new'}_${Date.now()}_${filename}`;
  const coverImagePath = path.join(uploadDir, uniqueFilename);

  // Read and validate the file stream
  const fileStream = createReadStream();
  const image = sharp();
  fileStream.pipe(image);

  // Retrieve metadata to validate dimensions
  const { width, height, size } = await image.metadata();

  // Check file size (between 100 KB and 5 MB)
  if (size < 100 * 1024 || size > 5 * 1024 * 1024) {
    throw new Error('File size must be between 100 KB and 5 MB.');
  }

  // Validate image dimensions
  const minDimension = 600;
  if (width < minDimension || height < minDimension) {
    throw new Error(`Image dimensions must be at least ${minDimension}x${minDimension} pixels.`);
  }

  // Save the processed image to the filesystem
  await image.toFile(coverImagePath);
  
  return coverImagePath;
};

module.exports = handleImageUpload;