import React, { useState, useEffect } from "react";

interface CarouselProps {
    directory: string; // e.g. "/static/images/home_fall"
    alt?: string;
    className?: string;
}

const Carousel: React.FC<CarouselProps> = ({ directory, alt = "Carousel image", className = "" }) => {
    const [images, setImages] = useState<string[]>([]);
    const [current, setCurrent] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/list-images?dir=${encodeURIComponent(directory)}`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data.images)) {
                    // Sort by filename
                    const sorted = data.images.slice().sort();
                    setImages(sorted.map((filename) => `${directory}/${filename}`));
                } else {
                    setImages([]);
                }
            })
            .catch(() => setImages([]))
            .finally(() => setLoading(false));
    }, [directory]);

    const total = images.length;
    const goPrev = () => setCurrent((prev) => (prev === 0 ? total - 1 : prev - 1));
    const goNext = () => setCurrent((prev) => (prev === total - 1 ? 0 : prev + 1));

    if (loading) return <div className="text-center text-gray-500">Loading images...</div>;
    if (total === 0) return <div className="text-center text-gray-500">No images found</div>;

    return (
        <div>
            <div className={`relative flex flex-col items-center mx-5 ${className}`}>
                <img
                    src={images[current]}
                    alt={alt}
                    className="rounded-lg shadow"
                />
                <button className="absolute -left-6 top-1/2 -translate-y-1/2 bg-[#B31B1B]/50 rounded-full w-14 h-14 flex items-center justify-center shadow-lg text-white transition hover:bg-[#B31B1B]/100 hover:scale-105"
                    onClick={goPrev}
                    aria-label="Previous"
                    style={{ zIndex: 2 }}
                >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
                        <path d="M15 6L9 12L15 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <button className="absolute -right-6 top-1/2 -translate-y-1/2 bg-[#B31B1B]/50 rounded-full w-14 h-14 flex items-center justify-center shadow-lg text-white transition hover:bg-[#B31B1B]/100 hover:scale-105"
                    onClick={goNext}
                    aria-label="Next"
                    style={{ zIndex: 2 }}
                >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
                        <path d="M9 6L15 12L9 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

            </div>
            <div className="mt-2 text-sm text-gray-600 text-center">
                {current + 1} / {total}
            </div>
        </div>

    );
};

export default Carousel;
