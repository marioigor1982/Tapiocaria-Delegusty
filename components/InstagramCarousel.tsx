import React from 'react';

const InstagramCarousel: React.FC = () => {
    const embedUrl = 'https://www.instagram.com/p/DLQ6iyLNL6O/embed';

    return (
        <div className="relative w-full max-w-sm mx-auto h-[550px]">
            <div className="h-full w-full overflow-hidden rounded-lg shadow-xl bg-gray-100">
                <iframe
                    src={embedUrl}
                    className="w-full h-full border-0"
                    allowTransparency={true}
                    allowFullScreen={true}
                    scrolling="no"
                    loading="lazy"
                    title="Publicação do Instagram sobre a nossa história"
                ></iframe>
            </div>
        </div>
    );
};

export default InstagramCarousel;
