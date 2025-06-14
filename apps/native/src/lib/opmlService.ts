import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { sdk } from './sdk';

export interface ImportOpmlResponse {
  message: string;
  imported: number;
  failed: number;
  errors: string[];
}

export class NativeOpmlService {
  async exportOpml(): Promise<void> {
    try {
      // APIからOPMLデータを取得
      const opmlContent = await sdk.opml.export();
      
      // XMLコンテンツをBase64エンコード
      const base64Data = btoa(unescape(encodeURIComponent(opmlContent)));

      // ファイル名を生成
      const filename = `feeds-${new Date().toISOString().split('T')[0]}.opml`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      // ファイルをドキュメントディレクトリに保存
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // ファイルを共有
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/xml',
          dialogTitle: 'OPMLファイルをエクスポート',
        });
      } else {
        throw new Error('ファイル共有が利用できません');
      }
    } catch (error) {
      console.error('OPML export error:', error);
      throw new Error('OPMLエクスポートに失敗しました');
    }
  }

  async importOpml(): Promise<ImportOpmlResponse> {
    try {
      // ファイル選択ダイアログを表示
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/xml', 'text/xml', 'application/opml+xml', '*/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        throw new Error('ファイル選択がキャンセルされました');
      }

      const asset = result.assets?.[0];
      if (!asset || !asset.uri) {
        throw new Error('ファイルが選択されませんでした');
      }

      // ファイルサイズの確認（5MB制限）
      if (asset.size && asset.size > 5 * 1024 * 1024) {
        throw new Error('ファイルサイズが大きすぎます（5MB以下にしてください）');
      }

      // React NativeのFormDataでファイルアップロード
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        type: asset.mimeType || 'application/xml',
        name: asset.name || 'imported.opml',
      } as unknown as Blob);

      // SDKを使用してインポート
      const importResult = await sdk.opml.import(formData);

      return importResult as ImportOpmlResponse;
    } catch (error) {
      console.error('OPML import error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('OPMLインポートに失敗しました');
    }
  }
}

export const nativeOpmlService = new NativeOpmlService();