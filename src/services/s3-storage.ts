import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'

// S3 Client configuration for Supabase Storage
const getS3Client = () => {
  return new S3Client({
    endpoint: process.env.NEXT_PUBLIC_S3_ENDPOINT || process.env.S3_ENDPOINT,
    region: process.env.NEXT_PUBLIC_S3_REGION || process.env.S3_REGION || 'us-east-2',
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true, // Required for Supabase
  })
}

export class S3StorageService {
  private static bucket = process.env.NEXT_PUBLIC_S3_BUCKET || process.env.S3_BUCKET || 'adminapp'

  // Upload file using S3
  static async uploadFile(
    key: string,
    file: File | Buffer,
    contentType?: string
  ): Promise<{ data: { key: string; url: string } | null; error: Error | null }> {
    try {
      console.log('S3StorageService: Creating S3 client with config:', {
        endpoint: process.env.NEXT_PUBLIC_S3_ENDPOINT || process.env.S3_ENDPOINT,
        region: process.env.NEXT_PUBLIC_S3_REGION || process.env.S3_REGION,
        bucket: this.bucket
      })
      
      const s3Client = getS3Client()
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: this.bucket,
          Key: key,
          Body: file,
          ContentType: contentType || (file instanceof File ? file.type : 'application/octet-stream'),
        },
      })

      console.log('S3StorageService: Starting upload...')
      await upload.done()
      console.log('S3StorageService: Upload completed successfully')

      // Generate public URL
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const url = `${supabaseUrl}/storage/v1/object/public/${this.bucket}/${key}`
      console.log('S3StorageService: Generated URL:', url)

      return {
        data: { key, url },
        error: null,
      }
    } catch (error) {
      console.error('S3StorageService: Upload failed:', error)
      return {
        data: null,
        error: error as Error,
      }
    }
  }

  // Delete file
  static async deleteFile(key: string): Promise<{ error: Error | null }> {
    try {
      const s3Client = getS3Client()
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })

      await s3Client.send(command)
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Upload bodegon logo using S3
  static async uploadBodegonLogo(
    file: File,
    bodegonId: string
  ): Promise<string> {
    try {
      console.log('S3StorageService: Starting logo upload for bodegon', bodegonId)
      const fileExt = file.name.split('.').pop()
      const fileName = `${bodegonId}_logo_${Date.now()}.${fileExt}`
      const key = `bodegones/logos/${fileName}`

      console.log('S3StorageService: Generated key:', key)
      const result = await this.uploadFile(key, file, file.type)
      console.log('S3StorageService: Upload result:', result)
      
      if (result.error || !result.data) {
        throw result.error || new Error('Upload failed')
      }
      
      return result.data.url
    } catch (error) {
      console.error('S3StorageService: Error in uploadBodegonLogo:', error)
      throw error
    }
  }

  // Upload restaurant logo using S3
  static async uploadRestaurantLogo(
    file: File,
    restaurantId: string
  ): Promise<string> {
    try {
      console.log('S3StorageService: Starting logo upload for restaurant', restaurantId)
      const fileExt = file.name.split('.').pop()
      const fileName = `${restaurantId}_logo_${Date.now()}.${fileExt}`
      const key = `restaurantes/logos/${fileName}`

      console.log('S3StorageService: Generated key:', key)
      const result = await this.uploadFile(key, file, file.type)
      console.log('S3StorageService: Upload result:', result)
      
      if (result.error || !result.data) {
        throw result.error || new Error('Upload failed')
      }
      
      return result.data.url
    } catch (error) {
      console.error('S3StorageService: Error in uploadRestaurantLogo:', error)
      throw error
    }
  }

  // Upload product image using S3
  static async uploadProductImage(
    productId: string,
    file: File,
    imageIndex: number = 0
  ): Promise<{ data: { key: string; url: string } | null; error: Error | null }> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${productId}_${imageIndex}_${Date.now()}.${fileExt}`
      const key = `productos/images/${fileName}`

      return await this.uploadFile(key, file, file.type)
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      }
    }
  }

  // Upload category image using S3
  static async uploadCategoryImage(
    categoryId: string,
    file: File
  ): Promise<{ data: { key: string; url: string } | null; error: Error | null }> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${categoryId}_${Date.now()}.${fileExt}`
      const key = `categorias/images/${fileName}`

      return await this.uploadFile(key, file, file.type)
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      }
    }
  }

  // Upload restaurant category image using S3
  static async uploadRestaurantCategoryImage(
    file: File,
    categoryId?: string
  ): Promise<string> {
    try {
      console.log('S3StorageService: Starting restaurant category image upload')
      const fileExt = file.name.split('.').pop()
      const fileName = categoryId 
        ? `${categoryId}_${Date.now()}.${fileExt}`
        : `category_${Date.now()}.${fileExt}`
      const key = `restaurantes/categorias/images/${fileName}`

      console.log('S3StorageService: Generated key:', key)
      const result = await this.uploadFile(key, file, file.type)
      console.log('S3StorageService: Upload result:', result)
      
      if (result.error || !result.data) {
        throw result.error || new Error('Upload failed')
      }
      
      return result.data.url
    } catch (error) {
      console.error('S3StorageService: Error in uploadRestaurantCategoryImage:', error)
      throw error
    }
  }

  // Upload restaurant subcategory image using S3
  static async uploadRestaurantSubcategoryImage(
    file: File,
    subcategoryId?: string
  ): Promise<string> {
    try {
      console.log('S3StorageService: Starting restaurant subcategory image upload')
      const fileExt = file.name.split('.').pop()
      const fileName = subcategoryId 
        ? `${subcategoryId}_${Date.now()}.${fileExt}`
        : `subcategory_${Date.now()}.${fileExt}`
      const key = `restaurantes/subcategorias/images/${fileName}`

      console.log('S3StorageService: Generated key:', key)
      const result = await this.uploadFile(key, file, file.type)
      console.log('S3StorageService: Upload result:', result)
      
      if (result.error || !result.data) {
        throw result.error || new Error('Upload failed')
      }
      
      return result.data.url
    } catch (error) {
      console.error('S3StorageService: Error in uploadRestaurantSubcategoryImage:', error)
      throw error
    }
  }

  // Helper to extract key from URL
  static extractKeyFromUrl(url: string): string | null {
    try {
      const match = url.match(/\/object\/public\/[^\/]+\/(.+)$/)
      return match ? match[1] : null
    } catch {
      return null
    }
  }

  // Delete bodegon logo and clean up
  static async deleteBodegonLogo(logoUrl: string): Promise<{ error: Error | null }> {
    try {
      const key = this.extractKeyFromUrl(logoUrl)
      
      if (!key) {
        return { error: new Error('Invalid logo URL') }
      }

      return await this.deleteFile(key)
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Delete restaurant logo and clean up
  static async deleteRestaurantLogo(logoUrl: string): Promise<{ error: Error | null }> {
    try {
      const key = this.extractKeyFromUrl(logoUrl)
      
      if (!key) {
        return { error: new Error('Invalid logo URL') }
      }

      return await this.deleteFile(key)
    } catch (error) {
      return { error: error as Error }
    }
  }
}