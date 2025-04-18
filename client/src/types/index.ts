import { User, Restaurant, Category, MenuItem } from "@shared/schema";

export interface RestaurantWithAdmin extends Restaurant {
  admin?: Omit<User, 'password'>;
}

export interface CategoryWithItems extends Category {
  items: MenuItem[];
}

export interface RestaurantWithMenu {
  restaurant: Restaurant;
  categories: CategoryWithItems[];
}

export interface AddRestaurantFormData {
  restaurant: {
    name: string;
    slug: string;
    logo?: string;
    status: 'active' | 'pending' | 'inactive';
  };
  user: {
    name: string;
    email: string;
    password: string;
  };
}

export interface FileWithPreview extends File {
  preview: string;
}
