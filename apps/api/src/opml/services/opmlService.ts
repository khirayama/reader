import { prisma } from "../../lib/prisma";
import { parseStringPromise, Builder } from "xml2js";
import type { Feed } from "@prisma/client";
import { FeedService } from "../../feeds/services/feedService";

interface OpmlOutline {
  $?: {
    text?: string;
    title?: string;
    type?: string;
    xmlUrl?: string;
    htmlUrl?: string;
  };
  outline?: OpmlOutline[];
}

interface OpmlDocument {
  opml: {
    head: Array<{
      title?: string[];
      dateCreated?: string[];
      dateModified?: string[];
    }>;
    body: Array<{
      outline: OpmlOutline[];
    }>;
  };
}

export const opmlService = {
  async exportOpml(userId: string, categoryId?: string): Promise<string> {
    try {
      const feeds = await prisma.feed.findMany({
        where: {
          userId,
        },
        orderBy: {
          title: "asc",
        },
      });

      const now = new Date().toUTCString();
      
      const opmlObj = {
        opml: {
          $: {
            version: "2.0",
          },
          head: [
            {
              title: ["RSS Reader Export"],
              dateCreated: [now],
              dateModified: [now],
            }
          ],
          body: [
            {
              outline: feeds.map((feed: Feed) => ({
                $: {
                  text: feed.title,
                  title: feed.title,
                  type: "rss",
                  xmlUrl: feed.url,
                  htmlUrl: feed.siteUrl || feed.url,
                },
              })),
            }
          ],
        },
      };

      const builder = new Builder({
        xmldec: { version: "1.0", encoding: "UTF-8" },
      });
      
      return builder.buildObject(opmlObj);
    } catch (error) {
      console.error("Error exporting OPML:", error);
      throw new Error("Failed to export OPML");
    }
  },

  async importOpml(userId: string, xmlContent: string): Promise<{ imported: number; failed: number; errors: string[] }> {
    try {
      const result: OpmlDocument = await parseStringPromise(xmlContent);
      
      if (!result.opml || !result.opml.body || !Array.isArray(result.opml.body) || result.opml.body.length === 0) {
        throw new Error("Invalid OPML structure");
      }
      
      const bodyElement = result.opml.body[0];
      if (!bodyElement.outline) {
        bodyElement.outline = [];
      }

      const outlines = this.extractOutlines(bodyElement.outline);
      const validOutlines = outlines.filter(outline => outline.$ && outline.$.xmlUrl);
      
      if (validOutlines.length === 0) {
        return { imported: 0, failed: 0, errors: [] };
      }

      // 並列で既存フィードをチェック
      const existingFeeds = await prisma.feed.findMany({
        where: {
          userId,
          url: { in: validOutlines.map(outline => outline.$!.xmlUrl!) },
        },
        select: { url: true },
      });
      
      const existingUrls = new Set(existingFeeds.map((feed: { url: string }) => feed.url));
      const newOutlines = validOutlines.filter(outline => !existingUrls.has(outline.$!.xmlUrl!));
      
      if (newOutlines.length === 0) {
        return { imported: 0, failed: 0, errors: [] };
      }

      // 並列でフィード作成を実行（制限付き並列処理）
      const BATCH_SIZE = 5; // 同時実行数を制限
      const errors: string[] = [];
      let imported = 0;
      let failed = 0;

      for (let i = 0; i < newOutlines.length; i += BATCH_SIZE) {
        const batch = newOutlines.slice(i, i + BATCH_SIZE);
        
        const batchResults = await Promise.allSettled(
          batch.map(async (outline) => {
            try {
              await FeedService.createFeed(userId, {
                url: outline.$!.xmlUrl!,
                title: outline.$!.title || outline.$!.text,
              });
              return { success: true, url: outline.$!.xmlUrl! };
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : "Unknown error";
              return { 
                success: false, 
                url: outline.$!.xmlUrl!, 
                error: errorMessage 
              };
            }
          })
        );
        
        // バッチ結果を集計
        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            if (result.value.success) {
              imported++;
            } else {
              failed++;
              errors.push(`Failed to import ${result.value.url}: ${result.value.error}`);
            }
          } else {
            failed++;
            errors.push(`Failed to process batch: ${result.reason}`);
          }
        }
        
        // バッチ間で少し待機してサーバー負荷を軽減
        if (i + BATCH_SIZE < newOutlines.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return { imported, failed, errors };
    } catch (error) {
      console.error("Error importing OPML:", error);
      throw new Error("Failed to parse OPML file");
    }
  },

  extractOutlines(outlines: OpmlOutline[]): OpmlOutline[] {
    const result: OpmlOutline[] = [];

    for (const outline of outlines) {
      if (outline.$ && outline.$.type === "rss" && outline.$.xmlUrl) {
        result.push(outline);
      }
      
      if (outline.outline && Array.isArray(outline.outline)) {
        result.push(...this.extractOutlines(outline.outline));
      }
    }

    return result;
  },
};