import React from 'react';
import { FileText, Wallet, Smartphone, ShieldCheck } from 'lucide-react';
import { StormLogo, APP_VERSION } from '../../constants';

interface PusulaAuthHeroProps {
  activeLogoTheme: string;
  activeTheme: string;
  designStyle: string;
}

const FEATURES = [
  { icon: <FileText size={16} />, title: 'Fatura, makbuz ve ekstre', text: 'Tek tıkla PDF; WhatsApp ve e-posta ile paylaşım.' },
  { icon: <Wallet size={16} />, title: 'Kasa, banka ve cari takibi', text: 'Bakiyeler her işlemde anında güncellenir.' },
  { icon: <Smartphone size={16} />, title: 'Masaüstü ve telefon', text: 'Aynı firma verisi tüm cihazlarda, internetsiz de çalışır.' },
  { icon: <ShieldCheck size={16} />, title: 'Güvenli bulut yedeği', text: 'Veriler firmanıza özel, şifreli oturumla korunur.' },
];

/**
 * Pusula tasarım stilinde giriş ekranının solundaki marka paneli.
 * Yalnızca geniş ekranlarda görünür (lg ve üstü); formlar sağ tarafta kalır.
 */
export const PusulaAuthHero: React.FC<PusulaAuthHeroProps> = ({ activeLogoTheme, activeTheme, designStyle }) => {
  return (
    <div className="pusula-auth-hero hidden lg:flex" aria-hidden="false">
      <div className="pusula-auth-hero-inner">
        <div className="pusula-auth-hero-brand">
          <div className="pusula-auth-hero-logo">
            <StormLogo className="w-full h-full" logoTheme={activeLogoTheme} theme={activeTheme} sidebarPattern="none" sidebarPatternOpacity={0} designStyle={designStyle} onlySvg={true} />
          </div>
          <div>
            <div className="pusula-auth-hero-name">Storm</div>
            <div className="pusula-auth-hero-sub">Ön Muhasebe</div>
          </div>
        </div>

        <div className="pusula-auth-hero-copy">
          <h1>İşletmenizin<br />pusulası.</h1>
          <p>Cari, stok, kasa ve faturalar tek ekranda. Nerede olduğunuzu her an bilin, sonraki adımı güvenle atın.</p>
        </div>

        <ul className="pusula-auth-hero-features">
          {FEATURES.map((f) => (
            <li key={f.title}>
              <span className="pusula-auth-hero-icon">{f.icon}</span>
              <span>
                <strong>{f.title}</strong>
                <small>{f.text}</small>
              </span>
            </li>
          ))}
        </ul>

        <div className="pusula-auth-hero-foot">Sürüm {APP_VERSION}</div>
      </div>
    </div>
  );
};
