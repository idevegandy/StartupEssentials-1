import { Restaurant, User, Category, Item } from "@shared/schema";

export interface RestaurantWithAdmin extends Restaurant {
  admin?: User;
}

export interface CategoryWithItems extends Category {
  items: Item[];
}

export interface RestaurantFullMenu {
  restaurant: Restaurant;
  categories: CategoryWithItems[];
}

export interface CreateRestaurantData {
  restaurant: {
    name: string;
    slug: string;
    logo?: string;
    description?: string;
    address?: string;
    phone?: string;
  };
  admin: {
    name: string;
    email: string;
    password: string;
  };
}

export interface MenuSettings {
  logo?: string;
  primaryColor: string;
  backgroundColor: string;
  facebookLink?: string;
  instagramLink?: string;
  websiteLink?: string;
  description?: string;
  phone?: string;
  address?: string;
}