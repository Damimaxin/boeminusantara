import { getActiveBanners } from "@/lib/content";
import BannerSlider from "./BannerSlider";

export default async function BannerStrip() {
  const banners = await getActiveBanners();
  if (banners.length === 0) return null;

  return <BannerSlider banners={banners} />;
}
