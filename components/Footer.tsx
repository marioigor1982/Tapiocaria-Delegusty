import React, { useState, useEffect } from 'react';
import { InstagramIcon } from './icons/InstagramIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { ChefHatIcon } from './icons/ChefHatIcon';

const MapPinIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);

const EnvelopeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);


const Footer: React.FC = () => {
  const [status, setStatus] = useState({ isOpen: false, text: 'Verificando...' });

  useEffect(() => {
    const checkStatus = () => {
      try {
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/Sao_Paulo',
          weekday: 'long',
          hour: 'numeric',
          hour12: false,
        }).formatToParts(new Date());

        const dayPart = parts.find((p) => p.type === 'weekday')?.value;
        const hourPart = parts.find((p) => p.type === 'hour')?.value;

        if (!dayPart || !hourPart) {
          setStatus({ isOpen: false, text: 'Fechado' });
          return;
        }
        
        const day = dayPart;
        const hour = parseInt(hourPart, 10);
        
        let isOpenNow = false;

        if (day !== 'Sunday' && hour >= 17 && hour <= 23) {
           isOpenNow = true;
        }

        setStatus({ 
            isOpen: isOpenNow, 
            text: isOpenNow ? 'Aberto' : 'Fechado' 
        });

      } catch (error) {
        console.error("Error checking time status:", error);
        setStatus({ isOpen: false, text: 'Fechado' });
      }
    };

    checkStatus();
    const intervalId = setInterval(checkStatus, 60000); // Re-check every minute

    return () => clearInterval(intervalId);
  }, []);

  return (
    <footer id="contato" className="bg-stone-800 text-stone-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          
          {/* Column 1: About */}
          <div className="md:pr-4">
            <div className="flex items-center mb-6">
                <img src="https://i.postimg.cc/4yJKJtq6/Delegusty.png" alt="Delegusty Logo" className="h-12 w-auto" />
                <span className="font-story-script text-white text-2xl ml-2">Tapiocaria Delegusty</span>
            </div>
            <p className="text-sm leading-relaxed mb-6">
              Nascida da paixão pela culinária brasileira, a Delegusty combina tradição e criatividade para levar até você uma experiência única e deliciosa, com ingredientes sempre frescos.
            </p>
            <div className="flex space-x-3">
              <a
                href="https://www.instagram.com/delegusty.tapioca?igsh=YjZld3hheDN2eGMz"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center bg-orange-600 text-white rounded-full transition-colors hover:bg-orange-500"
                aria-label="Instagram"
                title="Siga-nos no Instagram"
              >
                <InstagramIcon className="w-5 h-5" />
              </a>
              <a
                href="https://wa.me/5511922099496"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center bg-green-500 text-white rounded-full transition-colors hover:bg-green-400"
                aria-label="WhatsApp"
                title="Fale conosco no WhatsApp"
              >
                <WhatsAppIcon className="w-5 h-5" />
              </a>
              <a
                href="https://l.instagram.com/?u=https%3A%2F%2Fwww.ifood.com.br%2Fdelivery%2Fsao-paulo-sp%2Ftapiocas-delegusty-conjunto-habitacional-instituto-adventista%2Fa23a8762-6b06-4ee3-85b0-94ab21a38799%3FUTM_Medium%3Dshare%26utm_source%3Dig%26utm_medium%3Dsocial%26utm_content%3Dlink_in_bio%26fbclid%3DPAcGRvZgJleHRuA2FlbQIxMQBzcnRjBmFwcF9pZA85MzY2MTk3NDMzOTI0NTkAAaejiVzJfhyXAurgwAY-OWq5EHXUtyU_RIzqr1ThGRb3G3p6QMmBg6oqxQeSUA_aem_PdbaCsABhN-1hzKglCfMwg&e=AUDH0D5aFinRf5FUvptO_hJt1x2HkDPwvWBgPL1JIyzmtfaIj1H9Zz0nqPlT8FP9oCYtsOzZc6j2scvYJx_fiumO_uly49d398Y6kjud1fUvy1vr_K_IzxSofshVikhz8CZhAA4"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center bg-red-600 text-white rounded-full transition-colors hover:bg-red-500 p-1.5 overflow-hidden shadow-sm"
                aria-label="iFood"
                title="Peça no iFood"
              >
                <img 
                  src="https://i.imgur.com/PgGLJRS.png" 
                  alt="iFood" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes('PgGLJRS.jpg')) {
                      target.src = 'https://i.imgur.com/PgGLJRS.jpg';
                    } else if (!target.src.includes('TWzAuzB.png')) {
                      target.src = 'https://i.imgur.com/TWzAuzB.png';
                    }
                  }}
                />
              </a>
              <a
                href="https://drive.google.com/file/d/1JcHcnrXXhtvRm_ckLLgjgaBmCWYt_srY/view?usp=drive_link"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center bg-stone-600 text-white rounded-full transition-colors hover:bg-stone-500"
                aria-label="Baixe nosso cardápio"
                title="Baixe nosso cardápio"
              >
                <ChefHatIcon className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Column 2: Contact */}
          <div>
            <h3 className="text-white text-base font-bold uppercase tracking-wider mb-4">Contato</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start">
                <MapPinIcon className="w-5 h-5 mr-3 mt-0.5 text-orange-400 flex-shrink-0" />
                <a href="https://www.google.com/maps/search/?api=1&query=Estr.+de+Itapecerica,+7796+-+Capao+Redondo,+S%C3%A3o+Paulo+-+SP,+05858-005" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors">
                  Estr. de Itapecerica, 7796 - Capao Redondo, São Paulo - SP, 05858-005, Brazil
                </a>
              </li>
              <li className="flex items-start">
                <WhatsAppIcon className="w-5 h-5 mr-3 mt-0.5 text-orange-400 flex-shrink-0" />
                <a href="https://wa.me/5511922099496" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors">(11) 92209-9496</a>
              </li>
              <li className="flex items-start">
                <EnvelopeIcon className="w-5 h-5 mr-3 mt-0.5 text-orange-400 flex-shrink-0" />
                <a href="mailto:josue.marques.silva1965@gmail.com" className="hover:text-orange-400 transition-colors">josue.marques.silva1965@gmail.com</a>
              </li>
            </ul>
          </div>

          {/* Column 3: Opening Hours */}
          <div>
            <h3 className="text-white text-base font-bold uppercase tracking-wider mb-4">Horário de Funcionamento</h3>
            <div className="text-sm">
                <div className="flex justify-between items-center border-b border-stone-700 py-3">
                    <span>Segunda à Sábado</span>
                    <span className="text-white">17h - 00h</span>
                </div>
                 <div className="flex justify-between items-center border-b border-stone-700 py-3">
                    <span>Domingo</span>
                    <span className="text-white">Fechado</span>
                </div>
                <div className="flex justify-between items-center pt-4 mt-2">
                    <span>Status</span>
                    <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${status.isOpen ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}></span>
                        <span className={`font-semibold text-base ${status.isOpen ? 'text-green-400' : 'text-red-500'}`}>
                            {status.text}
                        </span>
                    </div>
                </div>
            </div>
          </div>

        </div>
      </div>
      <div className="bg-stone-900">
        <div className="container mx-auto px-4 py-4 text-center text-stone-500 text-xs">
          &copy; {new Date().getFullYear()} Delegusty Tapiocaria. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;