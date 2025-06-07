import RSSParser from 'rss-parser';
import axios from 'axios';
import { URL } from 'url';

interface ParsedFeed {
  title: string;
  description?: string;
  siteUrl?: string;
  items: ParsedArticle[];
}

interface ParsedArticle {
  title: string;
  url: string;
  description?: string;
  publishedAt: Date;
}

export class RSSService {
  private static parser = new RSSParser({
    timeout: 10000,
    headers: {
      'User-Agent': 'RSS-Reader/1.0',
    },
  });

  // RSS/Atom フィードを解析
  static async parseFeed(feedUrl: string): Promise<ParsedFeed> {
    try {
      console.log(`[RSSService] フィード解析開始: ${feedUrl}`);
      
      // URLの検証
      const url = new URL(feedUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('HTTPまたはHTTPS URLのみサポートされています');
      }

      // RSS フィードを取得してパース
      const feed = await this.parser.parseURL(feedUrl);
      console.log(`[RSSService] フィード解析成功: ${feed.title || 'タイトルなし'}`);

      // フィードのメタデータを抽出
      const parsedFeed: ParsedFeed = {
        title: feed.title || feedUrl,
        description: feed.description || undefined,
        siteUrl: feed.link || undefined,
        items: [],
      };

      // 記事データを変換
      if (feed.items) {
        parsedFeed.items = feed.items
          .map((item) => {
            if (!item.link || !item.title) {
              return null;
            }

            let publishedAt: Date;
            if (item.pubDate) {
              publishedAt = new Date(item.pubDate);
            } else if (item.isoDate) {
              publishedAt = new Date(item.isoDate);
            } else {
              publishedAt = new Date();
            }

            // 無効な日付をチェック
            if (isNaN(publishedAt.getTime())) {
              publishedAt = new Date();
            }

            return {
              title: item.title,
              url: item.link,
              description: item.contentSnippet || item.summary || undefined,
              publishedAt,
            } as ParsedArticle;
          })
          .filter((item): item is ParsedArticle => item !== null)
          .slice(0, 50); // 最新50記事まで
      }

      return parsedFeed;
    } catch (error) {
      console.error(`[RSSService] フィード解析エラー: ${feedUrl}`, error);
      
      if (error instanceof Error) {
        // タイムアウトエラー
        if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
          throw new Error('フィードの取得がタイムアウトしました');
        }
        // ネットワーク接続エラー
        if (error.message.includes('ENOTFOUND') || 
            error.message.includes('ECONNREFUSED') || 
            error.message.includes('ECONNRESET') ||
            error.message.includes('EHOSTUNREACH')) {
          throw new Error('フィードのURLにアクセスできません');
        }
        // XML/RSS パースエラー
        if (error.message.includes('Invalid XML') || 
            error.message.includes('Non-whitespace before first tag') ||
            error.message.includes('Unexpected end of input')) {
          throw new Error('有効なRSS/Atomフィードではありません');
        }
        // HTTP エラー
        if (error.message.includes('Request failed with status code')) {
          const statusMatch = error.message.match(/status code (\d+)/);
          const status = statusMatch ? statusMatch[1] : 'unknown';
          throw new Error(`HTTPエラー: ${status} - フィードにアクセスできません`);
        }
        // URLエラー
        if (error.message.includes('Invalid URL')) {
          throw new Error('無効なURLです');
        }
      }
      
      // その他の予期しないエラー
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      throw new Error(`フィードの解析に失敗しました: ${errorMessage}`);
    }
  }

  // フィードのバリデーション
  static async validateFeedUrl(feedUrl: string): Promise<boolean> {
    try {
      const url = new URL(feedUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        return false;
      }

      // HEADリクエストでフィードの存在確認
      const response = await axios.head(feedUrl, {
        timeout: 5000,
        headers: {
          'User-Agent': 'RSS-Reader/1.0',
        },
      });

      // Content-Typeをチェック（必須ではないが、ヒントとして使用）
      const contentType = response.headers['content-type'] || '';
      const isXml = contentType.includes('xml') || 
                   contentType.includes('rss') || 
                   contentType.includes('atom');

      return response.status === 200 && (isXml || contentType.includes('text/'));
    } catch {
      return false;
    }
  }

  // faviconのURLを取得
  static async getFaviconUrl(siteUrl?: string): Promise<string | undefined> {
    if (!siteUrl) return undefined;

    try {
      const url = new URL(siteUrl);
      const baseUrl = `${url.protocol}//${url.hostname}`;
      
      // 一般的なfaviconの場所をチェック
      const faviconUrls = [
        `${baseUrl}/favicon.ico`,
        `${baseUrl}/favicon.png`,
        `${baseUrl}/apple-touch-icon.png`,
      ];

      for (const faviconUrl of faviconUrls) {
        try {
          const response = await axios.head(faviconUrl, { timeout: 3000 });
          if (response.status === 200) {
            return faviconUrl;
          }
        } catch {
          continue;
        }
      }

      return undefined;
    } catch {
      return undefined;
    }
  }
}