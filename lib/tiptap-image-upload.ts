import { materialsClient } from '@/lib/api/materials/client'
import type { PresignedUrlResponse, ErrorResponse } from '@/lib/api/materials/types'

// 5MB 文件大小限制
const MAX_FILE_SIZE = 5 * 1024 * 1024

// 允许的图片类型
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
]

/**
 * 验证图片文件
 * @param file - 要验证的文件
 * @returns 验证结果对象
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // 检查文件类型
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'invalidFileType',
    }
  }

  // 检查文件大小
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'fileTooLarge',
    }
  }

  return { valid: true }
}

/**
 * 上传图片到R2存储
 *
 * 流程:
 * 1. 调用后端API获取预签名URL
 * 2. 直接上传文件到R2
 * 3. 返回最终访问URL
 *
 * @param file - 要上传的图片文件
 * @returns Promise<string> - 返回图片的最终访问URL
 * @throws Error - 上传失败时抛出错误
 */
export async function uploadImageToR2(file: File): Promise<string> {
  // 1. 验证文件
  const validation = validateImageFile(file)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  // 2. 获取预签名URL
  const presignedResult = await materialsClient.getPresignedUrl(
    file.name,
    file.type
  )

  // 检查是否返回错误
  if ('error' in presignedResult) {
    throw new Error(presignedResult.error || 'presignedUrlFailed')
  }

  // 3. 上传文件到R2
  const uploadSuccess = await fetch(presignedResult.upload_url, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  }).then(response => response.ok)

  if (!uploadSuccess) {
    throw new Error('fileUploadFailed')
  }

  // 4. 返回最终访问URL
  return presignedResult.file_url
}
