export const PHOTO_TAGS = [
  '人像', '单人', '双人', '多人', '风景', '自然',
  '动物', '建筑', '城市', '街头', '纪实', '古建',
  '静物', '光影', '夜景', '水域',
] as const;

export type PhotoTag = typeof PHOTO_TAGS[number];

export function filterPhotosByTags<T extends { tags?: readonly PhotoTag[] }>(
  photos: readonly T[],
  selectedTags: readonly PhotoTag[]
): T[] {
  if (selectedTags.length === 0) return [...photos];
  return photos.filter(photo => selectedTags.some(tag => photo.tags?.includes(tag)));
}
