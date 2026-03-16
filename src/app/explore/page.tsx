import { getAllPhotos } from '@/lib/photos';
import ExploreClient from './ExploreClient';

export default async function ExplorePage() {
  const allPhotos = await getAllPhotos();
  
  return <ExploreClient allPhotos={allPhotos} />;
}
