
export interface ImageInfo {
  url: string;
  isMain: boolean;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  images: ImageInfo[];
  price: string;
  category?: Page;
  rating?: number;
}

// Fix: Add missing CarouselItem interface for use in Carousel.tsx
export interface CarouselItem {
  id: number;
  title: string;
  subtitle: string;
  imageUrl: string;
}

export type Page = 'home' | 'doces' | 'salgadas' | 'bebidas';