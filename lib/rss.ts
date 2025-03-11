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
    const feed = await parser.parseURL(url);
    return {
      title: feed.title || '',
      url: feed.feedUrl || url,
      description: feed.description || '',
      items: feed.items.map(item => ({
        title: item.title || '',
        url: item.link || '',
        description: item.contentSnippet || '',
        content: item.content || '',
        publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
        guid: item.guid || item.link || '',
        author: item.author || '',
        categories: item.categories || [],
      })),
    };
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    throw new Error('Invalid RSS feed');
  }
}