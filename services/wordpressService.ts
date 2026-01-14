
import { Campaign, SiteSettings, WPSettings } from '../types';
import { generateStandaloneHTML } from './htmlGenerator';

// Base64 encode for Basic Auth
const getAuthHeader = (settings: WPSettings) => {
    return `Basic ${btoa(`${settings.username}:${settings.appPassword}`)}`;
};

export const updateWordPressPage = async (
    campaigns: Campaign[],
    siteSettings: SiteSettings,
    wpSettings: WPSettings
): Promise<{ success: boolean; message: string }> => {
    try {
        if (!wpSettings.siteUrl || !wpSettings.pageId || !wpSettings.username || !wpSettings.appPassword) {
            throw new Error('Lütfen tüm WordPress ayarlarını doldurun.');
        }

        const htmlContent = generateStandaloneHTML(campaigns, siteSettings);

        // Clean URL and create endpoint
        const baseUrl = wpSettings.siteUrl.replace(/\/$/, '');
        const endpoint = `${baseUrl}/wp-json/wp/v2/pages/${wpSettings.pageId}`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': getAuthHeader(wpSettings),
            },
            body: JSON.stringify({
                content: htmlContent,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Hata: ${response.status} ${response.statusText}`);
        }

        return { success: true, message: 'Sayfa başarıyla güncellendi!' };
    } catch (error) {
        console.error('WordPress Error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'WordPress bağlantı hatası.'
        };
    }
};
