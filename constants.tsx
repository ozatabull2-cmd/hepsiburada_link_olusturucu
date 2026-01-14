
import React from 'react';

export const DISCOUNT_PRESETS = [
  { label: '%50 İndirim', value: '%50 İndirim' },
  { label: '1 Alana 1 Bedava', value: '1 Alana 1 Bedava' },
  { label: 'Kargo Bedava', value: 'Kargo Bedava' },
  { label: 'Süper Fırsat', value: 'Süper Fırsat' },
  { label: 'Yıldızlı Ürün', value: 'Yıldızlı Ürün' },
  { label: 'Flaş İndirim', value: 'Flaş İndirim' },
  { label: 'Kupon Fırsatı', value: 'Kupon Fırsatı' }
];

export const DEFAULT_CAMPAIGNS = [
  {
    id: '1',
    title: 'Çocuk Kitaplarında Büyük Fırsat',
    discountType: '%50 İndirim',
    description: 'En sevilen çocuk kitaplarında bugüne özel net %50 indirim fırsatını kaçırmayın.',
    link: 'https://www.hepsiburada.com',
    imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400',
    buttonText: 'Hemen İncele',
    accentColor: '#FF6000',
    isActive: true
  },
  {
    id: '2',
    title: 'Penti Marka Ürünler',
    discountType: '1 Alana 1 Bedava',
    description: 'Penti ürünlerinde beklenen kampanya başladı. Sepette 1 alana 1 bedava avantajı sizi bekliyor.',
    link: 'https://www.hepsiburada.com',
    imageUrl: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&q=80&w=400',
    buttonText: 'Fırsatı Yakala',
    accentColor: '#1E40AF',
    isActive: false
  }
];

export const COLORS = [
  { name: 'Hepsiburada Orange', value: '#FF6000' },
  { name: 'Royal Blue', value: '#1E40AF' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Rose', value: '#E11D48' },
  { name: 'Violet', value: '#7C3AED' }
];
