import { requireSupabase } from '../lib/supabase'

const bucket = 'safeinturkiye-media'

export async function uploadImage(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
  const path = `${crypto.randomUUID()}.${extension}`
  const { error } = await requireSupabase().storage.from(bucket).upload(path, file, { upsert: false })
  if (error) throw error
  return requireSupabase().storage.from(bucket).getPublicUrl(path).data.publicUrl
}

export async function deleteOwnedImage(path: string) {
  const { error } = await requireSupabase().storage.from(bucket).remove([path])
  if (error) throw error
}
