import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export async function POST(request: NextRequest) {
  try {
    // 获取表单数据
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: '没有上传文件' },
        { status: 400 }
      )
    }

    // 硬编码 R2 配置
    const endpoint = 'https://24cfcc8e4a76c21639a4c186326aac7a.r2.cloudflarestorage.com'
    const accessKeyId = 'be4c0a38428fcb957f911204526b5b99'
    const secretAccessKey = 'e38c2c0ae3719c22afc1bd37e4565b06b448bbcbeea93eb81a9c4063551b71ac'
    const bucketName = 'joyful-words'

    console.log('开始上传图片到 Cloudflare R2...')
    console.log('文件名:', file.name)
    console.log('文件大小:', file.size)
    console.log('文件类型:', file.type)

    // 创建 S3 客户端（R2 兼容 S3 API）
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: endpoint,
      forcePathStyle: true, // 使用路径样式 URL，避免虚拟主机样式
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    })

    // 生成唯一的文件名
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const fileName = `images/${timestamp}-${randomString}.${fileExtension}`

    // 将文件转换为 Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 上传到 R2
    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    })

    await s3Client.send(putCommand)

    console.log('图片上传成功，文件名:', fileName)

    // 生成预签名 URL（有效期 7 天）
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileName,
    })

    const signedUrl = await getSignedUrl(s3Client, getCommand, {
      expiresIn: 7 * 24 * 60 * 60, // 7 天
    })

    console.log('生成预签名 URL:', signedUrl)

    return NextResponse.json({
      success: true,
      url: signedUrl,
      fileName: fileName,
    })
  } catch (error) {
    console.error('上传图片时发生错误:', error)
    return NextResponse.json(
      {
        error: '上传图片时发生错误',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
