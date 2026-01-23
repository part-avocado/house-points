import { getHouseData } from './utils/googleSheets';
import HousePoints from './components/HousePoints';
import { SpeedInsights } from "@vercel/speed-insights/next";

export const runtime = 'edge';
export const revalidate = 0; // Disable page caching

export default async function Home() {
  const initialData = await getHouseData();
  
  return (
    <>
      <HousePoints initialData={initialData} />
      <SpeedInsights />
    </>
  );
}
