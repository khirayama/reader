import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { nativeOpmlService, type ImportOpmlResponse } from '../../lib/opmlService';

interface OpmlManagerProps {
  onImportComplete?: () => void;
}

export function OpmlManager({ onImportComplete }: OpmlManagerProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportOpmlResponse | null>(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await nativeOpmlService.exportOpml();
      Alert.alert('成功', 'OPMLファイルをエクスポートしました');
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('エラー', error instanceof Error ? error.message : 'エクスポートに失敗しました');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    try {
      setIsImporting(true);
      setImportResult(null);
      
      const result = await nativeOpmlService.importOpml();
      setImportResult(result);
      
      if (result.imported > 0) {
        Alert.alert(
          'インポート完了',
          `${result.imported}件のフィードをインポートしました${result.failed > 0 ? `\n（${result.failed}件が失敗）` : ''}`
        );
        
        // インポート完了時のコールバック実行
        if (onImportComplete) {
          onImportComplete();
        }
      } else {
        Alert.alert('インポート完了', '新しいフィードはありませんでした');
      }
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('エラー', error instanceof Error ? error.message : 'インポートに失敗しました');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.title}>OPML インポート/エクスポート</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>フィードリストをエクスポート</Text>
          <Text style={styles.description}>
            現在のフィードリストをOPMLファイルとしてエクスポートします。
          </Text>
          <Button
            title={isExporting ? 'エクスポート中...' : 'OPMLファイルをエクスポート'}
            onPress={handleExport}
            disabled={isExporting}
            variant="primary"
            style={styles.button}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>フィードリストをインポート</Text>
          <Text style={styles.description}>
            OPMLファイルから複数のフィードを一括で追加します。
          </Text>
          <Button
            title={isImporting ? 'インポート中...' : 'OPMLファイルを選択'}
            onPress={handleImport}
            disabled={isImporting}
            variant="outline"
            style={styles.button}
          />
        </View>

        {/* インポート結果表示 */}
        {importResult && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>インポート結果</Text>
            <View style={styles.resultStats}>
              <Text style={styles.resultText}>成功: {importResult.imported}件</Text>
              <Text style={styles.resultText}>失敗: {importResult.failed}件</Text>
            </View>
            {importResult.errors.length > 0 && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorTitle}>エラー詳細:</Text>
                {importResult.errors.slice(0, 3).map((error) => (
                  <Text key={error} style={styles.errorText} numberOfLines={2}>
                    • {error}
                  </Text>
                ))}
                {importResult.errors.length > 3 && (
                  <Text style={styles.errorText}>...他{importResult.errors.length - 3}件</Text>
                )}
              </View>
            )}
          </View>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  button: {
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 20,
  },
  resultContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 12,
  },
  resultStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  resultText: {
    fontSize: 14,
    color: '#374151',
  },
  errorContainer: {
    marginTop: 12,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#DC2626',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginBottom: 4,
    paddingLeft: 8,
  },
});