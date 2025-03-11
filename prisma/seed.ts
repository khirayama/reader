import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash("password123", 10);

  // Create a demo user
  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "Demo User",
      password: passwordHash,
      settings: {
        create: {
          theme: "light",
          language: "en",
        },
      },
    },
  });

  console.log(`Created user with id: ${user.id}`);

  // Create some demo feeds
  const feeds = [
    {
      title: "CSS-Tricks",
      url: "https://css-tricks.com/feed/",
      description: "CSS-Tricks is a blog about websites and how to make them",
    },
    {
      title: "Smashing Magazine",
      url: "https://www.smashingmagazine.com/feed/",
      description: "For web designers and developers",
    },
  ];

  for (const feed of feeds) {
    const createdFeed = await prisma.feed.upsert({
      where: { url: feed.url },
      update: {},
      create: {
        ...feed,
        userId: user.id,
      },
    });
    console.log(`Created feed: ${createdFeed.title}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });