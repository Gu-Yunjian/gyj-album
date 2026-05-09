import { getAllPhotos } from '@/lib/photos';
import HomeClient from './explore/ExploreClient';

export default async function Home() {
  const allPhotos = await getAllPhotos();
  
  return <HomeClient allPhotos={allPhotos} />;
}
