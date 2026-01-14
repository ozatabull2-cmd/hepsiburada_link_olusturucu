
import React from 'react';
import { Campaign } from '../types';

interface CampaignCardProps {
  campaign: Campaign;
  onDelete: (id: string) => void;
  onEdit: (campaign: Campaign) => void;
  isPreview?: boolean;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, onDelete, onEdit, isPreview = false }) => {
  return (
    <div className={`bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] flex flex-col group relative h-full ${!campaign.isActive ? 'opacity-70' : ''}`}>
      {!isPreview && (
        <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all transform translate-y-3 group-hover:translate-y-0 flex gap-3 z-20">
          <button
            onClick={() => onEdit(campaign)}
            className="p-3.5 bg-white/95 backdrop-blur text-blue-600 rounded-2xl hover:bg-white shadow-2xl border border-blue-50 transition-all active:scale-90"
            title="Düzenle"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(campaign.id)}
            className="p-3.5 bg-white/95 backdrop-blur text-red-600 rounded-2xl hover:bg-white shadow-2xl border border-red-50 transition-all active:scale-90"
            title="Sil"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}

      <div className="relative h-64 md:h-72 overflow-hidden bg-slate-50">
        <img
          src={campaign.imageUrl || 'https://picsum.photos/800/600?grayscale'}
          alt={campaign.title}
          className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 ${!campaign.isActive ? 'grayscale' : ''}`}
        />
        {campaign.isActive ? (
          <>
            <div className="absolute top-6 left-6">
              <div
                className="bg-white/95 backdrop-blur-xl px-5 py-2.5 rounded-full shadow-2xl flex items-center justify-center gap-2 border border-white animate-bounce"
              >
                <span className="text-xs font-black tracking-tight uppercase leading-none mt-0.5" style={{ color: campaign.accentColor }}>
                  {campaign.discountType}
                </span>
              </div>
            </div>

            <div className="absolute top-6 right-6">
              <div className="bg-black/20 backdrop-blur-md border border-white/20 text-white px-3 py-1 rounded-full">
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-90">#İşbirliği</p>
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[3px] flex items-center justify-center">
            <div className="bg-white/10 border border-white/20 px-8 py-3 rounded-full text-xs font-black text-white shadow-2xl tracking-[0.3em] backdrop-blur-xl uppercase">YAKINDA</div>
          </div>
        )}
      </div>

      <div className="p-8 md:p-10 flex flex-col flex-grow text-center items-center">
        <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-4 tracking-tight leading-tight">{campaign.title || 'İsimsiz Kategori'}</h3>
        <p className="text-base text-slate-500 mb-10 flex-grow leading-relaxed font-medium">
          {campaign.description || (campaign.isActive
            ? `Kaçırılmayacak ${campaign.discountType} fırsatı ile alışverişe hemen başla!`
            : 'Bu kampanya şu an için sona ermiştir. Yeni indirimler için takipte kalın.')}
        </p>

        {campaign.isActive ? (
          <button
            className="w-full relative overflow-hidden group py-5 px-8 rounded-full text-center font-black text-white transition-all shadow-xl active:scale-95 cursor-pointer uppercase tracking-wide text-xs flex items-center justify-center gap-2"
            style={{
              backgroundColor: campaign.accentColor,
              boxShadow: `0 15px 30px -10px ${campaign.accentColor}77`
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2 leading-none">
              <span className="mt-0.5">{campaign.buttonText || 'Hemen İncele'}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </span>
          </button>
        ) : (
          <button
            disabled
            className="w-full py-5 px-8 rounded-2xl text-center font-black bg-slate-100 text-slate-400 cursor-not-allowed uppercase tracking-[0.2em] text-xs"
          >
            Şu an indirim yok
          </button>
        )}
      </div>
    </div>
  );
};
