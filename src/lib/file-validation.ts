/**
 * File Validation Utility
 * Secure file upload validation with magic number checks
 * Prevents file upload bypass attacks
 */

// ============================================================================
// MAGIC NUMBERS (FILE SIGNATURES)
// ============================================================================

/**
 * File magic numbers (first few bytes of file)
 * Used to verify actual file type regardless of extension
 */
export const FILE_MAGIC_NUMBERS: Record<string, {
  signature: number[];
  offset: number;
  extension: string[];
  mimeType: string[];
}> = {
  // Images
  jpeg: {
    signature: [0xFF, 0xD8, 0xFF],
    offset: 0,
    extension: ['.jpg', '.jpeg'],
    mimeType: ['image/jpeg', 'image/pjpeg'],
  },
  png: {
    signature: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    offset: 0,
    extension: ['.png'],
    mimeType: ['image/png'],
  },
  gif: {
    signature: [0x47, 0x49, 0x46, 0x38], // GIF8
    offset: 0,
    extension: ['.gif'],
    mimeType: ['image/gif'],
  },
  webp: {
    signature: [0x52, 0x49, 0x46, 0x46], // RIFF
    offset: 0,
    extension: ['.webp'],
    mimeType: ['image/webp'],
  },
  bmp: {
    signature: [0x42, 0x4D], // BM
    offset: 0,
    extension: ['.bmp'],
    mimeType: ['image/bmp'],
  },
  svg: {
    signature: null, // Text-based, checked differently
    offset: 0,
    extension: ['.svg'],
    mimeType: ['image/svg+xml'],
  },

  // Documents
  pdf: {
    signature: [0x25, 0x50, 0x44, 0x46], // %PDF
    offset: 0,
    extension: ['.pdf'],
    mimeType: ['application/pdf'],
  },
  doc: {
    signature: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1],
    offset: 0,
    extension: ['.doc'],
    mimeType: ['application/msword'],
  },
  docx: {
    signature: [0x50, 0x4B, 0x03, 0x04], // PK (ZIP format)
    offset: 0,
    extension: ['.docx'],
    mimeType: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  xls: {
    signature: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1],
    offset: 0,
    extension: ['.xls'],
    mimeType: ['application/vnd.ms-excel'],
  },
  xlsx: {
    signature: [0x50, 0x4B, 0x03, 0x04], // PK (ZIP format)
    offset: 0,
    extension: ['.xlsx'],
    mimeType: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  },
  ppt: {
    signature: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1],
    offset: 0,
    extension: ['.ppt'],
    mimeType: ['application/vnd.ms-powerpoint'],
  },
  pptx: {
    signature: [0x50, 0x4B, 0x03, 0x04], // PK (ZIP format)
    offset: 0,
    extension: ['.pptx'],
    mimeType: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  },

  // Archives
  zip: {
    signature: [0x50, 0x4B, 0x03, 0x04], // PK
    offset: 0,
    extension: ['.zip'],
    mimeType: ['application/zip', 'application/x-zip-compressed'],
  },
  rar: {
    signature: [0x52, 0x61, 0x72, 0x21], // Rar!
    offset: 0,
    extension: ['.rar'],
    mimeType: ['application/vnd.rar', 'application/x-rar-compressed'],
  },
  '7z': {
    signature: [0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C],
    offset: 0,
    extension: ['.7z'],
    mimeType: ['application/x-7z-compressed'],
  },

  // Audio
  mp3: {
    signature: [0xFF, 0xFB], // ID3v2
    offset: 0,
    extension: ['.mp3'],
    mimeType: ['audio/mpeg'],
  },
  wav: {
    signature: [0x52, 0x49, 0x46, 0x46], // RIFF
    offset: 0,
    extension: ['.wav'],
    mimeType: ['audio/wav'],
  },
  ogg: {
    signature: [0x4F, 0x67, 0x67, 0x53], // OggS
    offset: 0,
    extension: ['.ogg'],
    mimeType: ['audio/ogg'],
  },

  // Video
  mp4: {
    signature: [0x66, 0x74, 0x79, 0x70], // ftyp
    offset: 4,
    extension: ['.mp4'],
    mimeType: ['video/mp4'],
  },
  avi: {
    signature: [0x52, 0x49, 0x46, 0x46], // RIFF
    offset: 0,
    extension: ['.avi'],
    mimeType: ['video/x-msvideo'],
  },
  mov: {
    signature: null, // Complex check
    offset: 0,
    extension: ['.mov'],
    mimeType: ['video/quicktime'],
  },

  // Text-based (no magic number)
  txt: {
    signature: null,
    offset: 0,
    extension: ['.txt'],
    mimeType: ['text/plain'],
  },
  csv: {
    signature: null,
    offset: 0,
    extension: ['.csv'],
    mimeType: ['text/csv'],
  },
  json: {
    signature: null,
    offset: 0,
    extension: ['.json'],
    mimeType: ['application/json'],
  },
  xml: {
    signature: null,
    offset: 0,
    extension: ['.xml'],
    mimeType: ['application/xml', 'text/xml'],
  },
};

/**
 * Allowed file types by category
 */
export const ALLOWED_FILE_TYPES: Record<string, string[]> = {
  image: ['jpeg', 'png', 'gif', 'webp'],
  document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'],
  archive: ['zip', 'rar', '7z'],
  media: ['mp3', 'wav', 'ogg', 'mp4', 'avi', 'mov'],
};

/**
 * Maximum file sizes by category (in bytes)
 */
export const MAX_FILE_SIZES: Record<string, number> = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
  archive: 50 * 1024 * 1024, // 50MB
  media: 100 * 1024 * 1024, // 100MB
  default: 10 * 1024 * 1024, // 10MB
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate file using magic number detection
 * @param buffer - File buffer
 * @param declaredType - Declared file type/extension
 * @returns Object with isValid, detectedType, error
 */
export function validateFileMagicNumber(
  buffer: Buffer,
  declaredType: string
): {
  isValid: boolean;
  detectedType?: string;
  error?: string;
} {
  // Normalize declared type
  const normalizedType = declaredType.toLowerCase().replace('.', '').replace('image/', '').replace('application/', '').replace('text/', '');
  const typeWithoutMime = normalizedType.split('/')[0] || normalizedType;

  // Check if file type has magic number validation
  const fileInfo = Object.entries(FILE_MAGIC_NUMBERS).find(([key, value]) =>
    value.extension.some((ext) => ext === `.${normalizedType}`) ||
    value.extension.some((ext) => ext.replace('.', '') === typeWithoutMime) ||
    value.mimeType.some((mime) => mime.includes(normalizedType))
  );

  if (!fileInfo) {
    // Text-based file, skip magic number check
    return { isValid: true };
  }

  const [type, magicInfo] = fileInfo;

  // SVG is text-based, check content
  if (type === 'svg') {
    const content = buffer.toString('utf-8', 0, 100);
    if (content.includes('<svg') || content.includes('<?xml')) {
      return { isValid: true, detectedType: 'svg' };
    }
    return { isValid: false, error: 'Invalid SVG file' };
  }

  // Skip if no signature defined (text-based)
  if (!magicInfo.signature) {
    return { isValid: true };
  }

  // Read bytes at offset
  const fileSignature = Array.from(
    buffer.subarray(magicInfo.offset, magicInfo.offset + magicInfo.signature.length)
  );

  // Compare signatures
  const signatureMatch = magicInfo.signature.every((byte, index) => byte === fileSignature[index]);

  if (!signatureMatch) {
    return {
      isValid: false,
      error: `File content does not match declared type. Expected ${type}, but file signature doesn't match.`,
    };
  }

  // Additional check for Office files (stored in ZIP format)
  if (['docx', 'xlsx', 'pptx'].includes(type)) {
    // Check for specific Office XML markers
    const content = buffer.toString('utf-8', 0, Math.min(buffer.length, 1000));
    const officeMarkers: Record<string, string> = {
      docx: 'word/',
      xlsx: 'xl/',
      pptx: 'ppt/',
    };

    if (officeMarkers[type] && !content.includes(officeMarkers[type])) {
      return {
        isValid: false,
        error: `Invalid ${type.toUpperCase()} file structure`,
      };
    }
  }

  return { isValid: true, detectedType: type };
}

/**
 * Validate file size
 * @param size - File size in bytes
 * @param category - File category
 * @returns Object with isValid, maxSize, error
 */
export function validateFileSize(
  size: number,
  category: keyof typeof ALLOWED_FILE_TYPES
): {
  isValid: boolean;
  maxSize: number;
  error?: string;
} {
  const maxSize = MAX_FILE_SIZES[category] || MAX_FILE_SIZES.default;

  if (size > maxSize) {
    return {
      isValid: false,
      maxSize,
      error: `File size exceeds maximum allowed size of ${formatBytes(maxSize)}`,
    };
  }

  return { isValid: true, maxSize };
}

/**
 * Sanitize file name to prevent path traversal attacks
 * @param fileName - Original file name
 * @returns Sanitized file name
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path traversal attempts
  let sanitized = fileName.replace(/[\.\.\/\\]/g, '');

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove special characters that could cause issues
  sanitized = sanitized.replace(/[<>:"|?*\x00-\x1f]/g, '_');

  // Limit length
  const maxLength = 255;
  if (sanitized.length > maxLength) {
    const extIndex = sanitized.lastIndexOf('.');
    if (extIndex > 0) {
      const name = sanitized.substring(0, extIndex);
      const ext = sanitized.substring(extIndex);
      sanitized = name.substring(0, maxLength - ext.length) + ext;
    } else {
      sanitized = sanitized.substring(0, maxLength);
    }
  }

  // Ensure file has extension
  if (!sanitized.includes('.')) {
    sanitized += '.bin';
  }

  return sanitized;
}

/**
 * Get file category from MIME type or extension
 * @param mimeType - File MIME type
 * @param extension - File extension
 * @returns File category
 */
export function getFileCategory(mimeType: string, extension: string): keyof typeof ALLOWED_FILE_TYPES {
  const ext = extension.toLowerCase().replace('.', '');

  for (const [category, types] of Object.entries(ALLOWED_FILE_TYPES)) {
    if (types.includes(ext)) {
      return category as keyof typeof ALLOWED_FILE_TYPES;
    }
  }

  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/') || mimeType.startsWith('audio/')) return 'media';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('sheet') || mimeType.includes('presentation')) return 'document';

  return 'default';
}

/**
 * Generate safe file name for storage
 * @param originalName - Original file name
 * @param userId - User ID for namespacing
 * @returns Safe file name
 */
export function generateSafeFileName(originalName: string, userId: string): string {
  const sanitized = sanitizeFileName(originalName);
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 10);
  const ext = sanitized.substring(sanitized.lastIndexOf('.'));

  return `${userId}_${timestamp}_${randomStr}${ext}`;
}

/**
 * Format bytes to human-readable size
 * @param bytes - Size in bytes
 * @returns Formatted string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Comprehensive file validation
 * @param file - File object with name, size, type, and buffer
 * @returns Object with isValid, errors
 */
export function validateFile(file: {
  name: string;
  size: number;
  type: string;
  buffer?: Buffer;
}): {
  isValid: boolean;
  errors: string[];
  category?: string;
  safeName?: string;
} {
  const errors: string[] = [];

  // Validate file name
  const safeName = sanitizeFileName(file.name);

  // Get file category
  const category = getFileCategory(file.type, file.name.substring(file.name.lastIndexOf('.')));

  // Validate file size
  const sizeValidation = validateFileSize(file.size, category);
  if (!sizeValidation.isValid) {
    errors.push(sizeValidation.error!);
  }

  // Validate magic number if buffer provided
  if (file.buffer) {
    const ext = file.name.substring(file.name.lastIndexOf('.'));
    const magicValidation = validateFileMagicNumber(file.buffer, ext);
    if (!magicValidation.isValid) {
      errors.push(magicValidation.error!);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    category,
    safeName,
  };
}

/**
 * Get allowed extensions for a category
 * @param category - File category
 * @returns Array of allowed extensions
 */
export function getAllowedExtensions(category?: keyof typeof ALLOWED_FILE_TYPES): string[] {
  if (category) {
    const types = ALLOWED_FILE_TYPES[category] || [];
    return types.flatMap((type) => FILE_MAGIC_NUMBERS[type]?.extension || []);
  }

  // Return all allowed extensions
  return Object.values(ALLOWED_FILE_TYPES).flat().flatMap((type) =>
    FILE_MAGIC_NUMBERS[type]?.extension || []
  );
}

/**
 * Check if file type is allowed
 * @param mimeType - File MIME type
 * @param extension - File extension
 * @returns Boolean indicating if allowed
 */
export function isFileTypeAllowed(mimeType: string, extension: string): boolean {
  const category = getFileCategory(mimeType, extension);
  return category !== 'default' || ALLOWED_FILE_TYPES.document.includes(extension.replace('.', ''));
}
