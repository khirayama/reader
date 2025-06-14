import { z } from 'zod'

export const exportOpmlSchema = z.object({
  query: z.object({
    categoryId: z.string().optional(),
  }),
})

export const importOpmlSchema = z.object({
  file: z.any().refine((file) => {
    if (!file) return false
    if (
      file.mimetype !== 'text/xml' &&
      file.mimetype !== 'application/xml' &&
      file.mimetype !== 'text/x-opml+xml'
    ) {
      return false
    }
    return true
  }, 'Invalid OPML file format'),
})
