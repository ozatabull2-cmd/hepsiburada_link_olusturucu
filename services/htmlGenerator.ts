
import { Campaign, SiteSettings } from '../types';

export const generateStandaloneHTML = (campaigns: Campaign[], settings: SiteSettings): string => {
  const activeCampaigns = campaigns.filter(c => c.isActive);

  const quickLinksHTML = activeCampaigns.length > 0 ? `
    <div class="w-full overflow-x-auto no-scrollbar pb-2 md:pb-6 -mt-2 mb-8 md:mb-12">
      <div class="flex gap-3 px-6 w-max mx-auto md:mx-0 md:w-full md:justify-center md:flex-wrap">
        ${activeCampaigns.map(c => `
          <a href="#campaign-${c.id}" class="shrink-0 inline-flex items-center gap-2 bg-white px-4 py-2.5 rounded-full shadow-sm hover:shadow-md border border-slate-200 transition-all text-xs md:text-sm group active:scale-95 duration-200 whitespace-nowrap snap-center">
             <span class="font-bold text-slate-700">${c.title}</span>
             <span class="text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-900 text-white transition-colors uppercase tracking-tight">${c.discountType}</span>
          </a>
        `).join('')}
      </div>
    </div>
  ` : '';

  const cardsHTML = campaigns.map(c => `
    <div id="campaign-${c.id}" class="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-[0_15px_40px_-12px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden transition-all duration-500 ${c.isActive ? 'hover:-translate-y-3 hover:shadow-2xl' : 'opacity-80'} flex flex-col group h-full scroll-mt-6">
      <div class="relative h-48 md:h-72 overflow-hidden">
        <img src="${c.imageUrl}" alt="${c.title}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${c.isActive ? '' : 'grayscale'}" />
        
        ${c.isActive ? `
          <div class="absolute top-4 left-4 md:top-6 md:left-6">
             <div class="backdrop-blur-xl bg-white/90 border border-white/40 px-3 py-1.5 md:px-4 md:py-2 rounded-full shadow-2xl flex items-center justify-center gap-2 animate-bounce">
                <span class="text-[10px] md:text-xs font-black tracking-tight uppercase leading-none mt-0.5" style="color: ${c.accentColor}">${c.discountType}</span>
             </div>
          </div>
          
          <div class="absolute top-4 right-4 md:top-6 md:right-6">
             <div class="bg-black/20 backdrop-blur-md border border-white/20 text-white px-3 py-1 rounded-full">
                <p class="text-[9px] font-bold uppercase tracking-widest opacity-90">#İşbirliği</p>
             </div>
          </div>
        ` : `
          <div class="absolute inset-0 bg-black/40 backdrop-blur-[3px] flex items-center justify-center">
            <span class="bg-white/10 border border-white/30 text-white px-6 py-2 md:px-8 md:py-3 rounded-full text-xs md:text-sm font-black uppercase tracking-[0.3em] backdrop-blur-xl">YAKINDA</span>
          </div>
        `}
      </div>
      
      <div class="p-5 md:p-10 flex flex-col flex-grow text-center md:text-left items-center md:items-start">
        <h3 class="text-lg md:text-3xl font-black text-gray-900 mb-2 md:mb-4 leading-tight tracking-tight px-2 md:px-0">${c.title}</h3>
        <p class="text-xs md:text-base text-gray-500 mb-6 md:mb-10 flex-grow leading-relaxed font-medium line-clamp-3 md:line-clamp-none px-2 md:px-0">
          ${c.description}
        </p>
        
        ${c.isActive ? `
          <a href="${c.link}" target="_blank" rel="noopener noreferrer" 
             class="w-full group/btn relative overflow-hidden py-4 md:py-5 px-8 rounded-full md:rounded-2xl text-center font-black text-white transition-all shadow-xl hover:shadow-2xl active:scale-[0.96] flex items-center justify-center gap-2 uppercase tracking-wide text-xs md:text-sm"
             style="background-color: ${c.accentColor}; box-shadow: 0 10px 25px -5px ${c.accentColor}66">
            <span class="relative z-10 flex items-center justify-center gap-2 leading-none">
                <span className="mt-0.5">${c.buttonText}</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transition-transform group-hover/btn:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
            </span>
          </a>
        ` : `
          <div class="w-full py-4 md:py-5 px-8 rounded-full md:rounded-2xl text-center font-black bg-gray-100 text-gray-400 cursor-not-allowed uppercase tracking-wide text-xs md:text-sm">
            Şu an indirim yok
          </div>
        `}
      </div>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="tr" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${settings.pageTitle}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #f8fafc; color: #1e293b; overflow-x: hidden; }
        .bg-pattern { background: radial-gradient(circle at top left, #ffffff, #f1f5f9); }
        /* Hide scrollbar for cleaner look */
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    </style>
</head>
<body class="min-h-screen bg-pattern">
    <header class="bg-white/80 backdrop-blur-xl border-b border-gray-100 relative z-50">
        <div class="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 text-center">
            <h1 class="text-2xl md:text-6xl font-black text-gray-900 mb-3 md:mb-5 tracking-tighter leading-tight">${settings.pageTitle}</h1>
            <p class="text-gray-500 max-w-2xl mx-auto font-medium text-xs md:text-xl leading-relaxed px-4 line-clamp-3 md:line-clamp-none">${settings.description}</p>
        </div>
        
        <!-- Quick Nav Strip -->
        ${quickLinksHTML}
    </header>

    <main class="max-w-7xl mx-auto px-4 md:px-12 py-6 md:py-12 pb-32">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-16">
            ${cardsHTML}
        </div>
    </main>

    <footer class="bg-white border-t border-gray-100 py-12 md:py-20 mt-auto">
        <div class="max-w-6xl mx-auto px-6 text-center">
            <p class="text-gray-400 text-xs md:text-sm font-black uppercase tracking-[0.4em] mb-4">&copy; ${new Date().getFullYear()} ${settings.pageTitle}</p>
        </div>
    </footer>
</body>
</html>`;
};
