import { supabase } from '@/lib/supabase'

export class StorageService {
  // Upload file to specific bucket
  static async uploadFile(
    bucketName: string,
    filePath: string,
    file: File
  ): Promise<{ data: { path: string } | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Upload and replace existing file
  static async upsertFile(
    bucketName: string,
    filePath: string,
    file: File
  ): Promise<{ data: { path: string } | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // This will overwrite if exists
        })

      if (error) {
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Get public URL for a file
  static getPublicUrl(bucketName: string, filePath: string): string {
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  // Delete file
  static async deleteFile(
    bucketName: string,
    filePaths: string[]
  ): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .remove(filePaths)

      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // List files in a folder
  static async listFiles(
    bucketName: string,
    folderPath: string = ''
  ): Promise<{ data: Record<string, unknown>[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list(folderPath, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        })

      if (error) {
        return { data: null, error }
      }

      return { data: data || [], error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Specific methods for bodegon logos
  static async uploadBodegonLogo(
    bodegonId: string,
    file: File
  ): Promise<{ data: { path: string; url: string } | null; error: Error | null }> {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${bodegonId}_logo_${Date.now()}.${fileExt}`
      const filePath = `bodegones/logos/${fileName}`

      const { data: uploadData, error: uploadError } = await this.uploadFile(
        'adminapp', // Your bucket name
        filePath,
        file
      )

      if (uploadError || !uploadData) {
        return { data: null, error: uploadError }
      }

      // Get public URL
      const publicUrl = this.getPublicUrl('adminapp', uploadData.path)

      return {
        data: {
          path: uploadData.path,
          url: publicUrl
        },
        error: null
      }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Upload product images
  static async uploadProductImage(
    productId: string,
    file: File,
    imageIndex: number = 0
  ): Promise<{ data: { path: string; url: string } | null; error: Error | null }> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${productId}_${imageIndex}_${Date.now()}.${fileExt}`
      const filePath = `productos/images/${fileName}`

      const { data: uploadData, error: uploadError } = await this.uploadFile(
        'adminapp',
        filePath,
        file
      )

      if (uploadError || !uploadData) {
        return { data: null, error: uploadError }
      }

      const publicUrl = this.getPublicUrl('adminapp', uploadData.path)

      return {
        data: {
          path: uploadData.path,
          url: publicUrl
        },
        error: null
      }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Upload category images
  static async uploadCategoryImage(
    categoryId: string,
    file: File
  ): Promise<{ data: { path: string; url: string } | null; error: Error | null }> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${categoryId}_${Date.now()}.${fileExt}`
      const filePath = `categorias/images/${fileName}`

      const { data: uploadData, error: uploadError } = await this.uploadFile(
        'adminapp',
        filePath,
        file
      )

      if (uploadError || !uploadData) {
        return { data: null, error: uploadError }
      }

      const publicUrl = this.getPublicUrl('adminapp', uploadData.path)

      return {
        data: {
          path: uploadData.path,
          url: publicUrl
        },
        error: null
      }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Helper to extract file path from URL
  static extractFilePathFromUrl(url: string, bucketName: string = 'adminapp'): string | null {
    try {
      const urlParts = url.split(`/storage/v1/object/public/${bucketName}/`)
      return urlParts.length > 1 ? urlParts[1] : null
    } catch {
      return null
    }
  }

  // Delete logo and update bodegon record
  static async deleteBodegonLogo(logoUrl: string): Promise<{ error: Error | null }> {
    try {
      const filePath = this.extractFilePathFromUrl(logoUrl)
      
      if (!filePath) {
        return { error: new Error('Invalid logo URL') }
      }

      return await this.deleteFile('adminapp', [filePath])
    } catch (error) {
      return { error: error as Error }
    }
  }
}