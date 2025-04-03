import { getHouseData } from './utils/googleSheets';
import HousePoints from './components/HousePoints';

export const revalidate = 0; // Disable page caching

export default async function Home() {
  const initialData = await getHouseData();
  
  return <HousePoints initialData={initialData} />;
}
