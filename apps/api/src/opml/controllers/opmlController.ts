import type { Request, Response } from 'express'
import type { AuthenticatedRequest } from '../../types/express'
import { opmlService } from '../services/opmlService'

export const opmlController = {
  async exportOpml(req: AuthenticatedRequest, res: Response) {
    try {
      const { categoryId } = req.query
      const userId = req.user!.userId

      const opmlContent = await opmlService.exportOpml(userId, categoryId as string | undefined)

      res.setHeader('Content-Type', 'application/xml')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="feeds-${new Date().toISOString().split('T')[0]}.opml"`
      )
      res.send(opmlContent)
    } catch (error) {
      console.error('Export OPML error:', error)
      res.status(500).json({ error: 'Failed to export OPML' })
    }
  },

  async importOpml(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' })
      }

      const userId = req.user!.userId
      const xmlContent = req.file.buffer.toString('utf-8')

      const result = await opmlService.importOpml(userId, xmlContent)

      return res.json({
        message: 'OPML import completed',
        imported: result.imported,
        failed: result.failed,
        errors: result.errors,
      })
    } catch (error) {
      console.error('Import OPML error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return res.status(400).json({ error: errorMessage })
    }
  },
}
