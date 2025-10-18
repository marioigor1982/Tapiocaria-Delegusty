import React, { useState, useEffect, useRef } from 'react';
import { InstagramIcon } from './icons/InstagramIcon';
import { SearchIcon } from './icons/SearchIcon';
import type { Page, MenuItem } from '../types';

const MenuIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);

const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);

interface HeaderProps {
    onNavigate: (page: Page, anchor?: string) => void;
    allItems: MenuItem[];
    onSearchResultSelect: (item: MenuItem) => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, allItems, onSearchResultSelect }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<MenuItem[]>([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (searchTerm.trim().length === 0) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const delayDebounceFn = setTimeout(() => {
            const lowercasedTerm = searchTerm.toLowerCase().trim();
            const priceSearchTerm = lowercasedTerm.replace('r$', '').replace(',', '.').trim();

            let results: MenuItem[] = [];

            if (['doce', 'doces'].includes(lowercasedTerm)) {
                results = allItems.filter(item => item.category === 'doces');
            } else if (['salgada', 'salgadas'].includes(lowercasedTerm)) {
                results = allItems.filter(item => item.category === 'salgadas');
            } else if (['bebida', 'bebidas'].includes(lowercasedTerm)) {
                results = allItems.filter(item => item.category === 'bebidas');
            } else {
                results = allItems.filter(item => {
                    const itemPrice = item.price.toLowerCase().replace('r$', '').replace(',', '.').trim();
                    
                    const nameMatch = item.name.toLowerCase().includes(lowercasedTerm);
                    const descriptionMatch = item.description.toLowerCase().includes(lowercasedTerm);
                    const priceMatch = priceSearchTerm ? itemPrice.includes(priceSearchTerm) : false;

                    return nameMatch || descriptionMatch || priceMatch;
                });
            }
            
            setSearchResults(results);
            setIsSearching(false);
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, allItems]);

    const handleSelectResult = (item: MenuItem) => {
        onSearchResultSelect(item);
        setSearchTerm('');
        setSearchResults([]);
        setIsSearchFocused(false);
        setIsMenuOpen(false);
    };

    const navLinks = [
        { href: '#home', label: 'Início' },
        { href: '#sobre', label: 'sobre nós' },
        { href: '#menu', label: 'Tapiocas' },
        { href: '#contato', label: 'contato' },
    ];
    
    const handleLinkClick = (e: React.MouseEvent, href: string) => {
        e.preventDefault();
        onNavigate('home', href);
        setIsMenuOpen(false);
    };

    const handlePageSwitch = (e: React.MouseEvent, page: Page) => {
        e.preventDefault();
        onNavigate(page);
        setIsDropdownOpen(false);
        setIsMenuOpen(false);
    };

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const searchComponent = (isMobile = false) => (
        <div className={`relative ${isMobile ? 'w-full' : 'w-56'}`} ref={searchRef}>
            <div className="relative">
                <input
                    type="search"
                    placeholder="Buscar no cardápio..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    className={`w-full py-2 pl-10 pr-4 rounded-full transition-colors duration-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500
                        ${isMobile ? 'bg-gray-100 text-gray-800' 
                        : isScrolled ? 'bg-gray-100 text-gray-800' 
                        : 'bg-white/20 text-white placeholder-white/70'}`}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <SearchIcon className={`w-5 h-5 ${isMobile ? 'text-gray-500' : isScrolled ? 'text-gray-500' : 'text-white/80'}`} />
                </div>
            </div>
            {isSearchFocused && searchTerm.length > 0 && (
                <div className="absolute top-full mt-2 w-full md:w-80 rounded-lg shadow-xl bg-white ring-1 ring-black ring-opacity-5 z-50 max-h-96 overflow-y-auto">
                    {searchResults.length > 0 ? (
                        <ul>
                            {searchResults.map(item => {
                                const mainImage = item.images.find(img => img.isMain) || item.images[0];
                                return (
                                <li key={item.id}>
                                    <button 
                                        onMouseDown={() => handleSelectResult(item)}
                                        className="w-full text-left flex items-center gap-4 p-3 hover:bg-orange-50 transition-colors"
                                    >
                                        <img src={mainImage.url} alt={item.name} className="w-12 h-12 object-cover rounded-md flex-shrink-0" />
                                        <div className="flex-grow">
                                            <p className="font-semibold text-gray-800 text-sm">{item.name}</p>
                                            <p className="font-bold text-orange-700 text-xs">{item.price}</p>
                                        </div>
                                    </button>
                                </li>
                                )
                            })}
                        </ul>
                    ) : isSearching ? (
                        <p className="p-4 text-center text-sm text-gray-500">
                           Buscando...
                        </p>
                    ) : (
                        <p className="p-4 text-center text-sm text-gray-500">
                           {`Nenhum resultado para "${searchTerm}"`}
                        </p>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <>
             <a 
                href="#home" 
                onClick={(e) => handleLinkClick(e, '#home')} 
                className="fixed top-2 left-2 z-50 transition-transform duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-orange-400/80 focus:rounded-full"
                aria-label="Voltar ao início"
            >
                <img 
                    src="https://i.postimg.cc/4yJKJtq6/Delegusty.png" 
                    alt="Delegusty Logo" 
                    className="h-28 w-auto drop-shadow-[0_3px_5px_rgba(0,0,0,0.5)]" 
                />
            </a>
            <header className={`fixed w-full top-0 z-40 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-sm shadow-md' : 'bg-transparent'}`}>
                <div className="container mx-auto px-4">
                    <div className="flex justify-end items-center py-3">

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center space-x-4">
                            {navLinks.map((link) => (
                            link.href === '#menu' ? (
                                    <div 
                                        key={link.href} 
                                        className="relative"
                                        onMouseEnter={() => setIsDropdownOpen(true)}
                                        onMouseLeave={() => setIsDropdownOpen(false)}
                                    >
                                        <a 
                                            href={link.href} 
                                            onClick={(e) => handleLinkClick(e, link.href)} 
                                            className={`cursor-pointer font-semibold transition-colors duration-300 ${isScrolled ? 'text-gray-700 hover:text-orange-600' : 'text-white hover:text-orange-200 text-shadow-strong'} flex items-center gap-1.5`}
                                            aria-haspopup="true"
                                            aria-expanded={isDropdownOpen}
                                        >
                                            {link.label}
                                            <ChevronDownIcon className={`w-3 h-3 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                        </a>
                                        <div 
                                            className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 rounded-lg shadow-xl bg-white/95 backdrop-blur-sm ring-1 ring-black ring-opacity-5 transition-all duration-200 ease-out origin-top ${isDropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
                                        >
                                            <div className="py-2">
                                                <a href="#" onClick={(e) => handlePageSwitch(e, 'doces')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-100 hover:text-orange-800 transition-colors">
                                                    Tapiocas Doces
                                                </a>
                                                <a href="#" onClick={(e) => handlePageSwitch(e, 'salgadas')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-100 hover:text-orange-800 transition-colors">
                                                    Tapiocas Salgadas
                                                </a>
                                                <a href="#" onClick={(e) => handlePageSwitch(e, 'bebidas')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-100 hover:text-orange-800 transition-colors">
                                                    Bebidas e Outros
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <a key={link.href} href={link.href} onClick={(e) => handleLinkClick(e, link.href)} className={`font-semibold transition-colors duration-300 ${isScrolled ? 'text-gray-700 hover:text-orange-600' : 'text-white hover:text-orange-200 text-shadow-strong'}`}>
                                        {link.label}
                                    </a>
                                )
                            ))}
                            {searchComponent()}
                            <a
                                href="https://www.instagram.com/delegusty.tapioca?igsh=YjZld3hheDN2eGMz"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-semibold ${isScrolled ? 'text-orange-800 bg-orange-100 hover:bg-orange-200' : 'text-white border-2 border-white hover:bg-white/20 text-shadow-strong'}`}
                            >
                                <InstagramIcon className="w-5 h-5" />
                                <span>siga-nos</span>
                            </a>
                        </nav>

                        {/* Mobile Menu Button */}
                        <div className="lg:hidden">
                            <button onClick={toggleMenu} aria-label="Toggle menu" className={`relative z-50 transition-colors duration-300 ${isScrolled ? 'text-gray-800' : 'text-white'}`}>
                                {isMenuOpen ? <CloseIcon className="w-7 h-7" /> : <MenuIcon className="w-7 h-7" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div className={`lg:hidden fixed inset-0 bg-orange-50 z-30 transform ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out`}>
                    <div className="flex flex-col h-full pt-24 p-8">
                        {searchComponent(true)}
                        <nav className="flex flex-col items-center justify-center h-full space-y-8 mt-4">
                            {navLinks.map((link) => (
                                <a key={link.href} href={link.href} className="text-3xl font-semibold text-orange-900 hover:text-orange-600" onClick={(e) => handleLinkClick(e, link.href)}>
                                    {link.label}
                                </a>
                            ))}
                            <a
                                href="https://www.instagram.com/delegusty.tapioca?igsh=YjZld3hheDN2eGMz"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-6 py-3 rounded-full text-lg text-orange-800 bg-orange-200 hover:bg-orange-300 transition-colors"
                            >
                                <InstagramIcon className="w-6 h-6" />
                                <span className="font-semibold">siga-nos</span>
                            </a>
                        </nav>
                    </div>
                </div>
            </header>
        </>
    );
};

export default Header;