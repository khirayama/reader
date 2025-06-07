import { prisma } from "../../lib/prisma";
import { parseStringPromise, Builder } from "xml2js";
import type { Feed } from "@prisma/client";
import { feedService } from "../../feeds/services/feedService";

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
    head: {
      title?: string;
      dateCreated?: string;
      dateModified?: string;
    };
    body: {
      outline: OpmlOutline[];
    };
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
          head: {
            title: "RSS Reader Export",
            dateCreated: now,
            dateModified: now,
          },
          body: {
            outline: feeds.map((feed: Feed) => ({
              $: {
                text: feed.title,
                title: feed.title,
                type: "rss",
                xmlUrl: feed.url,
                htmlUrl: feed.siteUrl || feed.url,
              },
            })),
          },
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
      
      if (!result.opml || !result.opml.body) {
        throw new Error("Invalid OPML structure");
      }
      
      if (!result.opml.body.outline) {
        // OPMLに含まれるアウトラインがない場合は空の配列として扱う
        result.opml.body.outline = [];
      }

      const outlines = this.extractOutlines(result.opml.body.outline);
      const errors: string[] = [];
      let imported = 0;
      let failed = 0;

      for (const outline of outlines) {
        if (outline.$ && outline.$.xmlUrl) {
          try {
            const existingFeed = await prisma.feed.findFirst({
              where: {
                userId,
                url: outline.$.xmlUrl,
              },
            });

            if (!existingFeed) {
              await feedService.createFeed(userId, {
                url: outline.$.xmlUrl,
                title: outline.$.title || outline.$.text,
              });
              imported++;
            }
          } catch (error) {
            failed++;
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            errors.push(`Failed to import ${outline.$.xmlUrl}: ${errorMessage}`);
          }
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