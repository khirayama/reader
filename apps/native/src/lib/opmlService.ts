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
      const response = await sdk.opml.exportOpml();
      
      // BlobをBase64文字列に変換
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // data:application/xml;base64, プレフィックスを削除
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(response);
      });

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
        type: ['application/xml', 'text/xml', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        throw new Error('ファイル選択がキャンセルされました');
      }

      const asset = result.assets[0];
      if (!asset) {
        throw new Error('ファイルが選択されませんでした');
      }

      // ファイルの内容を読み取り
      const fileContent = await FileSystem.readAsStringAsync(asset.uri);

      // FormDataを作成（Web互換性のために）
      const blob = new Blob([fileContent], { type: 'application/xml' });
      const file = new File([blob], asset.name || 'imported.opml', { type: 'application/xml' });

      // SDKを使用してインポート
      const importResult = await sdk.opml.importOpml(file);

      return importResult;
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