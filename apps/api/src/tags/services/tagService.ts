import { prisma } from '../../lib/prisma';
import type { CreateTagInput, UpdateTagInput, AssignTagToFeedInput } from '../validators/tagSchemas';

export class TagService {
  // Get all tags for a user
  static async getUserTags(userId: string, search?: string, limit = 50, offset = 0) {
    const where = {
      userId,
      ...(search && {
        name: {
          contains: search,
          mode: 'insensitive' as const
        }
      })
    };

    const [tags, total] = await Promise.all([
      prisma.tag.findMany({
        where,
        include: {
          _count: {
            select: { feedTags: true }
          }
        },
        orderBy: { name: 'asc' },
        skip: offset,
        take: limit
      }),
      prisma.tag.count({ where })
    ]);

    return {
      tags: tags.map((tag: any) => ({
        ...tag,
        feedCount: tag._count.feedTags
      })),
      total,
      hasMore: offset + limit < total
    };
  }

  // Get tag by ID
  static async getTagById(userId: string, tagId: string) {
    const tag = await prisma.tag.findFirst({
      where: { id: tagId, userId },
      include: {
        _count: {
          select: { feedTags: true }
        }
      }
    });

    if (!tag) {
      throw new Error('タグが見つかりません');
    }

    return {
      ...tag,
      feedCount: tag._count.feedTags
    };
  }

  // Create a new tag
  static async createTag(userId: string, data: CreateTagInput) {
    // Check if tag name already exists for user
    const existingTag = await prisma.tag.findFirst({
      where: {
        userId,
        name: data.name
      }
    });

    if (existingTag) {
      throw new Error('このタグ名は既に使用されています');
    }

    const tag = await prisma.tag.create({
      data: {
        ...data,
        userId
      }
    });

    return tag;
  }

  // Update tag
  static async updateTag(userId: string, tagId: string, data: UpdateTagInput) {
    // Check if tag exists and belongs to user
    const existingTag = await prisma.tag.findFirst({
      where: { id: tagId, userId }
    });

    if (!existingTag) {
      throw new Error('タグが見つかりません');
    }

    // Check for name conflicts if name is being updated
    if (data.name && data.name !== existingTag.name) {
      const nameConflict = await prisma.tag.findFirst({
        where: {
          userId,
          name: data.name,
          id: { not: tagId }
        }
      });

      if (nameConflict) {
        throw new Error('このタグ名は既に使用されています');
      }
    }

    const updatedTag = await prisma.tag.update({
      where: { id: tagId },
      data,
      include: {
        _count: {
          select: { feedTags: true }
        }
      }
    });

    return {
      ...updatedTag,
      feedCount: updatedTag._count.feedTags
    };
  }

  // Delete tag
  static async deleteTag(userId: string, tagId: string) {
    // Check if tag exists and belongs to user
    const existingTag = await prisma.tag.findFirst({
      where: { id: tagId, userId }
    });

    if (!existingTag) {
      throw new Error('タグが見つかりません');
    }

    // Delete tag (this will cascade to feedTags due to onDelete: Cascade)
    await prisma.tag.delete({
      where: { id: tagId }
    });

    return { success: true };
  }

  // Assign tag to feed
  static async assignTagToFeed(userId: string, feedId: string, data: AssignTagToFeedInput) {
    // Verify feed belongs to user
    const feed = await prisma.feed.findFirst({
      where: { id: feedId, userId }
    });

    if (!feed) {
      throw new Error('フィードが見つかりません');
    }

    let tag;

    if (data.tagId) {
      // Use existing tag
      tag = await prisma.tag.findFirst({
        where: { id: data.tagId, userId }
      });

      if (!tag) {
        throw new Error('タグが見つかりません');
      }
    } else if (data.tagName) {
      // Create new tag or find existing
      tag = await prisma.tag.upsert({
        where: {
          userId_name: {
            userId,
            name: data.tagName
          }
        },
        create: {
          name: data.tagName,
          color: data.color,
          userId
        },
        update: {}
      });
    } else {
      throw new Error('タグIDまたはタグ名を指定してください');
    }

    // Check if tag is already assigned to feed
    const existingAssignment = await prisma.feedTag.findFirst({
      where: {
        feedId,
        tagId: tag.id
      }
    });

    if (existingAssignment) {
      throw new Error('このタグは既にフィードに割り当てられています');
    }

    // Create feed-tag association
    const feedTag = await prisma.feedTag.create({
      data: {
        feedId,
        tagId: tag.id,
        userId
      },
      include: {
        tag: true
      }
    });

    return feedTag;
  }

  // Remove tag from feed
  static async removeTagFromFeed(userId: string, feedId: string, tagId: string) {
    // Verify feed belongs to user
    const feed = await prisma.feed.findFirst({
      where: { id: feedId, userId }
    });

    if (!feed) {
      throw new Error('フィードが見つかりません');
    }

    // Check if tag assignment exists
    const feedTag = await prisma.feedTag.findFirst({
      where: {
        feedId,
        tagId,
        userId
      }
    });

    if (!feedTag) {
      throw new Error('このタグはフィードに割り当てられていません');
    }

    // Remove assignment
    await prisma.feedTag.delete({
      where: { id: feedTag.id }
    });

    return { success: true };
  }

  // Get feeds by tag
  static async getFeedsByTag(userId: string, tagId: string, limit = 50, offset = 0) {
    // Verify tag belongs to user
    const tag = await prisma.tag.findFirst({
      where: { id: tagId, userId }
    });

    if (!tag) {
      throw new Error('タグが見つかりません');
    }

    const [feedTags, total] = await Promise.all([
      prisma.feedTag.findMany({
        where: {
          tagId,
          userId
        },
        include: {
          feed: {
            include: {
              feedTags: {
                include: {
                  tag: true
                }
              },
              _count: {
                select: { articles: true }
              }
            }
          }
        },
        skip: offset,
        take: limit
      }),
      prisma.feedTag.count({
        where: { tagId, userId }
      })
    ]);

    const feeds = feedTags.map((ft: any) => ({
      ...ft.feed,
      tags: ft.feed.feedTags.map((fTag: any) => fTag.tag),
      articleCount: ft.feed._count.articles
    }));

    return {
      feeds,
      total,
      hasMore: offset + limit < total,
      tag
    };
  }
}