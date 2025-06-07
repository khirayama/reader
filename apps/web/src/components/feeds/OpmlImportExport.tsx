'use client'

import { useState, useRef } from 'react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { sdk } from '../../lib/sdk'

interface ImportResult {
  imported: number
  failed: number
  errors: string[]
}

interface OpmlImportExportProps {
  onImportComplete?: () => void
}

export default function OpmlImportExport({ onImportComplete }: OpmlImportExportProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    try {
      setIsExporting(true)
      setError(null)
      
      const blob = await sdk.opml.exportOpml()
      
      // ダウンロード用のリンクを作成
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `feeds-${new Date().toISOString().split('T')[0]}.opml`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Export error:', error)
      setError('エクスポートに失敗しました')
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsImporting(true)
      setError(null)
      setImportResult(null)
      
      const result = await sdk.opml.importOpml(file)
      setImportResult(result)
      
      // ファイル入力をリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // インポート完了時のコールバック実行
      if (result.imported > 0 && onImportComplete) {
        onImportComplete()
      }
      
    } catch (error) {
      console.error('Import error:', error)
      setError('インポートに失敗しました')
    } finally {
      setIsImporting(false)
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">OPML インポート/エクスポート</h3>
      
      <div className="space-y-4">
        {/* エクスポート */}
        <div>
          <h4 className="font-medium mb-2">フィードリストをエクスポート</h4>
          <p className="text-sm text-gray-600 mb-3">
            現在のフィードリストをOPMLファイルとしてダウンロードします。
          </p>
          <Button 
            onClick={handleExport} 
            disabled={isExporting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isExporting ? 'エクスポート中...' : 'OPMLファイルをダウンロード'}
          </Button>
        </div>

        <hr />

        {/* インポート */}
        <div>
          <h4 className="font-medium mb-2">フィードリストをインポート</h4>
          <p className="text-sm text-gray-600 mb-3">
            OPMLファイルから複数のフィードを一括で追加します。
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".opml,.xml"
            onChange={handleImport}
            className="hidden"
          />
          <Button 
            onClick={handleImportClick} 
            disabled={isImporting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isImporting ? 'インポート中...' : 'OPMLファイルを選択'}
          </Button>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* インポート結果表示 */}
        {importResult && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
            <h5 className="font-medium mb-2">インポート結果</h5>
            <div className="text-sm space-y-1">
              <p>成功: {importResult.imported}件</p>
              <p>失敗: {importResult.failed}件</p>
              {importResult.errors.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium text-red-600">エラー詳細:</p>
                  <ul className="list-disc list-inside text-red-600 mt-1">
                    {importResult.errors.map((error, index) => (
                      <li key={index} className="text-xs">{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}