import Parser from 'rss-parser';

// 拡張したパーサータイプ
type CustomFeed = {
  title: string;
  description?: string;
  link?: string;
  feedUrl?: string;
};

type CustomItem = {
  title: string;
  link?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  guid?: string;
  isoDate?: string;
  author?: string;
  categories?: string[];
};

// RSSパーサーインスタンスの作成
const parser: Parser<CustomFeed, CustomItem> = new Parser({
  customFields: {
    feed: ['description', 'title', 'link', 'feedUrl'],
    item: ['content', 'contentSnippet', 'guid', 'pubDate', 'title', 'link', 'author', 'categories'],
  },
});

// フィードを取得して解析する関数
export async function fetchRssFeed(url: string) {
  try {
    // 相対URLや短縮URLをサポートするため、URL解析
    let parsedURL: URL;
    try {
      parsedURL = new URL(url);
    } catch (e) {
      throw new Error(`Invalid URL format: ${url}`);
    }

    // CORS問題を避けるためにサーバーサイドでの処理を確認
    if (typeof window === 'undefined') {
      // サーバーサイド実行
      try {
        const feed = await parser.parseURL(url);
        
        if (!feed || !feed.title) {
          throw new Error('RSS feed does not contain required title');
        }
        
        // 空のフィードでもエラーにならないようにする
        if (!feed.items || !Array.isArray(feed.items)) {
          feed.items = [];
        }
        
        return {
          title: feed.title || parsedURL.hostname,
          url: feed.feedUrl || url,
          description: feed.description || '',
          items: feed.items.map(item => ({
            title: item.title || '無題',
            url: item.link || '',
            description: item.contentSnippet || '',
            content: item.content || '',
            publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
            guid: item.guid || item.link || '',
            author: item.author || '',
            categories: item.categories || [],
          })).filter(item => item.url) // URLがないアイテムは除外
        };
      } catch (parseError) {
        console.error('Parser error:', parseError);
        throw new Error(`RSS parsing failed: ${(parseError as Error).message}`);
      }
    } else {
      // クライアントサイド実行 - CORSエラーを避けるためにAPIを経由
      throw new Error('RSS feed fetching is only supported on the server side');
    }
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    if ((error as Error).message.includes('status code 404')) {
      throw new Error('Feed URL not found (404)');
    } else if ((error as Error).message.includes('status code')) {
      throw new Error(`Server error: ${(error as Error).message}`);
    }
    throw new Error(`Invalid RSS feed: ${(error as Error).message}`);
  }
}