import { v2 as cloudinary } from 'cloudinary'
import { randomUUID } from 'crypto'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export async function uploadPassport(file) {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) throw new Error('Cloudinary is not configured.')
  const buffer = Buffer.from(await file.arrayBuffer())
  const publicId = `passport_${Date.now()}_${randomUUID()}`

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'small-business-application/passports',
        public_id: publicId,
        overwrite: false,
        resource_type: 'image',
        type: 'authenticated',
        timeout: 30000,
      },
      (error, result) => {
        if (error) return reject(new Error(`Cloudinary upload failed: ${error.message}`))
        if (!result) return reject(new Error('Cloudinary upload returned no result.'))
        resolve(result)
      }
    )

    uploadStream.on('error', reject)
    uploadStream.end(buffer)
  })
}
