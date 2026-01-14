
export interface Campaign {
  id: string;
  title: string;
  discountType: string;
  description: string;
  link: string;
  imageUrl: string;
  buttonText: string;
  accentColor: string;
  isActive: boolean;
}

export interface SiteSettings {
  pageTitle: string;
  description: string;
  headerImageUrl: string;
  primaryColor: string;
}

export interface WPSettings {
  siteUrl: string;
  pageId: string;
  username: string;
  appPassword: string;
}
