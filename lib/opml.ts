import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { Feed } from '@prisma/client';

// OPMLフィード情報の型定義
export interface OPMLFeed {
  title: string;
  xmlUrl: string;
  htmlUrl?: string;
  description?: string;
}

// OPMLオブジェクトの型定義
export interface OPMLData {
  title: string;
  dateCreated?: string;
  ownerName?: string;
  ownerEmail?: string;
  feeds: OPMLFeed[];
}

/**
 * FeedモデルのリストからOPMLデータを生成
 */
export function generateOPML(feeds: Feed[], title: string = 'My RSS Feeds'): string {
  const now = new Date().toISOString();
  
  // OPMLのXML構造を構築
  const opml = {
    '?xml': {
      '@_version': '1.0',
      '@_encoding': 'UTF-8'
    },
    opml: {
      '@_version': '2.0',
      head: {
        title,
        dateCreated: now,
      },
      body: {
        outline: feeds.map(feed => ({
          '@_text': feed.title,
          '@_title': feed.title,
          '@_type': 'rss',
          '@_xmlUrl': feed.url,
          '@_description': feed.description || ''
        }))
      }
    }
  };

  // XMLビルダーの設定（属性プレフィックスなど）
  const builder = new XMLBuilder({
    attributeNamePrefix: '@_',
    ignoreAttributes: false,
    format: true,
    processEntities: false,
  });
  
  // XMLに変換して返す
  return builder.build(opml);
}

/**
 * OPML文字列を解析してフィード情報の配列を返す
 */
export function parseOPML(opmlContent: string): OPMLFeed[] {
  const parser = new XMLParser({
    attributeNamePrefix: '@_',
    ignoreAttributes: false,
  });
  
  try {
    const result = parser.parse(opmlContent);
    const outlines = result.opml?.body?.outline;
    
    if (!outlines) {
      return [];
    }
    
    // 単一のoutlineの場合は配列に変換、複数の場合はそのまま使用
    const outlineArr = Array.isArray(outlines) ? outlines : [outlines];
    
    // フィードの配列を構築
    const feeds: OPMLFeed[] = [];
    
    // 再帰的に全てのoutlineを処理する関数
    const processOutlines = (items: any[]) => {
      items.forEach(item => {
        // typeがrssのoutlineはフィードとして扱う
        if (item['@_type'] === 'rss' && item['@_xmlUrl']) {
          feeds.push({
            title: item['@_title'] || item['@_text'] || 'Untitled Feed',
            xmlUrl: item['@_xmlUrl'],
            htmlUrl: item['@_htmlUrl'],
            description: item['@_description']
          });
        }
        
        // 子のoutlineがある場合は再帰的に処理
        if (item.outline) {
          const children = Array.isArray(item.outline) ? item.outline : [item.outline];
          processOutlines(children);
        }
      });
    };
    
    processOutlines(outlineArr);
    return feeds;
    
  } catch (error) {
    console.error('OPML parsing error:', error);
    throw new Error('Invalid OPML format');
  }
}