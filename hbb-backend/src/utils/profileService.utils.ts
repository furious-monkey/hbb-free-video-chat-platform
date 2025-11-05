import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fetch Interests
export async function fetchInterests(interestsIds: string[]): Promise<any[]> {
  if (!interestsIds.length) {
    return [];
  }

  const interests = await prisma.interest.findMany({
    where: {
      id: {
        in: interestsIds,
      },
    },
    select: {
      name: true,
      image: true,
    },
  });

  return interests.map(interest => ({
    name: interest.name,
    image: interest.image,
  }));
}

// Fetch Zodiac Sign
export async function fetchZodiacSign(zodiacSignId: string | null): Promise<any | null> {
  if (!zodiacSignId) {
    return null;
  }

  const zodiacSign = await prisma.zodiacSign.findUnique({
    where: { id: zodiacSignId },
    select: {
      name: true,
      image: true,
    },
  });

  return zodiacSign
    ? {
        name: zodiacSign.name,
        image: zodiacSign.image,
      }
    : null;
}

//fetch categories
// Fetch Categories
export async function fetchCategories(categoryIds: string[]): Promise<any[]> {
  if (!categoryIds.length) {
    return [];
  }

  const categories = await prisma.category.findMany({
    where: {
      id: {
        in: categoryIds,
      },
    },
    select: {
      name: true,
      imageUrl: true,
    },
  });

  return categories.map(category => ({
    name: category.name,
    imageUrl: category.imageUrl, 
  }));
}
