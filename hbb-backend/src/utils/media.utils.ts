import { PrismaClient } from '@prisma/client';

// new
const prisma = new PrismaClient();

export async function fetchProfileImage(profileImageId: string | null): Promise<any | null> {
  if (!profileImageId) {
    return null;
  }

  const profileImage = await prisma.image.findFirst({
    where: { id: profileImageId },
    select: {
      key: true,
      url: true,
      Location: true,
    },
  });

  return profileImage
    ? {
        key: profileImage.key,
        url: profileImage.url,
        Location: profileImage.Location,
      }
    : null;
}

export async function fetchPromotionalVideos(promotionalVideoId: string[]): Promise<any[]> {
  if (!promotionalVideoId.length) {
    return [];
  }

  const promotionalVideos = await prisma.video.findMany({
    where: {
      id: {
        in: promotionalVideoId,
      },
    },
    select: {
      key: true,
      url: true,
      Location: true,
    },
  });

  return promotionalVideos.map(video => ({
    key: video.key,
    url: video.url,
    Location: video.Location,
  }));
}

export async function fetchCategoryImage(imageId: string | null): Promise<any | null> {
  if (!imageId) {
    return null;
  }

  const categoryImage = await prisma.image.findFirst({
    where: { id: imageId },
    select: {
      key: true,
      url: true,
      Location: true,
    },
  });

  return categoryImage
    ? {
        key: categoryImage.key,
        url: categoryImage.url,
        Location: categoryImage.Location,
      }
    : null;
}