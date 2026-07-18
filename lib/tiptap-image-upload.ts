import { materialsClient, uploadFileToPresignedUrl } from '@/lib/api/materials/client'
import { isSupportedImageFile, MAX_IMAGE_UPLOAD_BYTES, resolveUploadContentType } from '@/lib/upload-file'

/**
 * 验证图片文件
 * @param file - 要验证的文件
 * @returns 验证结果对象
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // 检查文件类型
  if (!isSupportedImageFile(file)) {
    return {
      valid: false,
      error: 'invalidFileType',
    }
  }

  // 检查文件大小
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
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
    resolveUploadContentType(file.name, file.type),
    file.size
  )

  // 检查是否返回错误
  if ('error' in presignedResult) {
    let errorMessage: string
    try {
      const rawError = presignedResult.error
      errorMessage = typeof rawError === 'string' 
        ? (rawError === 'Internal Service Error' ? '服务器内部错误，请稍后重试' : rawError) 
        : JSON.stringify(rawError) || '获取预签名URL失败，请稍后重试'
    } catch {
      errorMessage = '获取预签名URL失败，请稍后重试'
    }
    throw new Error(errorMessage)
  }

  // 3. 上传文件到R2
  const uploadSuccess = await uploadFileToPresignedUrl(
    presignedResult.upload_url,
    file,
    resolveUploadContentType(file.name, file.type)
  )

  if (!uploadSuccess) {
    throw new Error('fileUploadFailed')
  }

  // 4. 后端校验对象后返回最终访问 URL
  const completed = await materialsClient.completeUpload(presignedResult)
  if ('error' in completed) {
    throw new Error(completed.error)
  }
  return completed.file_url
}
