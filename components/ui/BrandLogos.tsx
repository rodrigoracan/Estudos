import React from 'react';

export const YouTubeBrandLogo: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
    {/* Ícone Oficial do YouTube (Play Vermelho com cantos arredondados) */}
    <div className="w-[38px] h-[26px] bg-[#FF0000] rounded-[7px] flex items-center justify-center shrink-0 shadow-sm">
      <svg className="w-3.5 h-3.5 fill-white translate-x-[1px]" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z" />
      </svg>
    </div>
    
    {/* Tipografia Oficial Nítida YouTube em Branco */}
    <span 
      className="text-white font-black tracking-[-0.05em] text-[22px] leading-none"
      style={{ fontFamily: "'Roboto', 'YouTube Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif" }}
    >
      YouTube
    </span>
  </div>
);

export const GoogleDriveBrandLogo: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
    {/* Ícone Oficial do Google Drive (Triângulo Isométrico) */}
    <svg className="w-7 h-7 shrink-0" viewBox="0 0 40 40" fill="none">
      <path d="M26.5 4L39.5 26.5H27L14 4H26.5Z" fill="#FFBA00" />
      <path d="M39.5 26.5L33.2 37.5H7.8L14 26.5H39.5Z" fill="#00AC47" />
      <path d="M14 4L1 26.5L7.8 37.5L20.8 15L14 4Z" fill="#2684FC" />
    </svg>
    
    {/* Tipografia Oficial Nítida Google Drive em Branco */}
    <div 
      className="flex items-center text-[21px] leading-none tracking-[-0.02em]"
      style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
    >
      <span className="text-white font-bold">Google</span>
      <span className="text-gray-200 font-normal ml-1.5">Drive</span>
    </div>
  </div>
);
