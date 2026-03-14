import { getHomePhotos, GalleryPhoto } from '@/lib/photos';
import HomeClient from './HomeClient';

// 个人信息
const PROFILE = {
  name: '顾元杰',
  school: '中国传媒大学',
  slogan: '用镜头记录世界的温柔',
};

// 基于日期的种子随机数生成器
// 确保同一天内返回相同的随机序列
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// 使用 Fisher-Yates 洗牌算法，基于日期种子
function shuffleWithDailySeed<T>(array: T[]): T[] {
  // 获取当前日期作为种子 (格式: 20240311)
  const today = new Date();
  const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  
  const shuffled = [...array];
  let seed = dateSeed;
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    // 使用种子生成随机索引
    const randomValue = seededRandom(seed++);
    const j = Math.floor(randomValue * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

export default async function Home() {
  // 首页照片来自两个来源：影集 + 统一文件夹 (home-photos)
  const photosData = await getHomePhotos();

  // 合并真实照片 + 占位照片
  const allPhotos = photosData.length >= 30 
    ? photosData 
    : [...photosData, ...generateMockPhotos(30 - photosData.length)];
  
  // 服务端随机排序：每天变化一次
  const shuffledPhotos = shuffleWithDailySeed(allPhotos);

  return <HomeClient photos={shuffledPhotos} profile={PROFILE} />;
}

// 生成占位照片
function generateMockPhotos(count: number): GalleryPhoto[] {
  const albums = [
    { name: '城市漫步', title: '城市漫步' },
    { name: '自然风光', title: '自然风光' },
    { name: '人文纪实', title: '人文纪实' },
    { name: '建筑摄影', title: '建筑摄影' },
  ];
  
  const subjects = [
    '晨曦微光', '黄昏时刻', '夜色迷人', '雨后初晴', '雪景静谧', 
    '夏日炎炎', '秋风瑟瑟', '春意盎然', '冬日暖阳', '老街回忆',
    '高楼林立', '公园漫步', '海边听涛', '山顶远眺', '湖畔倒影',
  ];

  const photos: GalleryPhoto[] = [];
  
  for (let i = 0; i < count; i++) {
    const album = albums[i % albums.length];
    const subject = subjects[i % subjects.length];
    const index = String((i % 20) + 1).padStart(2, '0');
    const seed = i + 1000;
    
    photos.push({
      src: `https://picsum.photos/seed/${seed}/800/600`,
      mediumSrc: `https://picsum.photos/seed/${seed}/600/450`,
      thumbSrc: `https://picsum.photos/seed/${seed}/400/300`,
      album: album.name,
      albumTitle: album.title,
      index: index,
      info: { 
        title: `${subject}`, 
        desc: `拍摄于${['北京', '上海', '杭州', '成都', '西安', '厦门'][i % 6]}` 
      },
    });
  }
  
  return photos;
}
