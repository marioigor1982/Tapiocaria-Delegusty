import React from 'react';
import InstagramCarousel from './InstagramCarousel';

const AboutUs: React.FC = () => {
    return (
        <section id="sobre" className="py-16 sm:py-24 bg-white">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left Column: Instagram Carousel */}
                    <div className="flex justify-center md:justify-start">
                        <InstagramCarousel />
                    </div>

                    {/* Right Column: Text Content */}
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-orange-900 font-ubuntu uppercase tracking-wider">
                            Nossa História
                        </h2>
                        <div className="w-24 h-1 bg-orange-500 mx-auto md:mx-0 mb-8"></div>
                        <p className="text-lg text-gray-600 leading-relaxed">
                            A Delegusty nasceu da paixão pela culinária brasileira e do desejo de compartilhar o sabor autêntico da tapioca. Nossas receitas combinam tradição e criatividade, utilizando apenas ingredientes frescos e selecionados para levar até você uma experiência única e deliciosa. Cada tapioca é feita com muito amor, da nossa família para a sua.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutUs;