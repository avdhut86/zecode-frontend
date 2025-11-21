"use client";

export default function LitZonePage() {
    // Mock Reels Data
    const reels = [
        { id: 1, title: "Summer Vibes", views: "1.2M", likes: "45K" },
        { id: 2, title: "New Collection Drop", views: "850K", likes: "32K" },
        { id: 3, title: "Behind the Scenes", views: "2.1M", likes: "120K" },
        { id: 4, title: "Street Style", views: "500K", likes: "15K" },
        { id: 5, title: "Outfit of the Day", views: "900K", likes: "50K" },
        { id: 6, title: "Sneaker Head", views: "1.5M", likes: "80K" },
        { id: 7, title: "Urban Culture", views: "750K", likes: "28K" },
        { id: 8, title: "Fashion Week", views: "3.2M", likes: "200K" },
    ];

    return (
        <main className="min-h-screen bg-black text-white py-12">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h1 className="font-din text-5xl md:text-7xl font-bold uppercase tracking-tighter mb-4 text-brand-red">
                        LIT ZONE
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Check out the latest drops, trends, and vibes from our Instagram. #ZECODE #LIT
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {reels.map((reel) => (
                        <div key={reel.id} className="aspect-[9/16] bg-gray-900 rounded-lg overflow-hidden relative group cursor-pointer border border-gray-800 hover:border-brand-red transition-colors">
                            {/* Placeholder for Video/Image */}
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 group-hover:bg-gray-700 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-500 group-hover:text-white transition-colors">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                                </svg>
                            </div>

                            {/* Overlay Info */}
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                                <h3 className="font-bold text-lg mb-1">{reel.title}</h3>
                                <div className="flex items-center justify-between text-xs text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                            <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                                            <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                        </svg>
                                        {reel.views}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                            <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.16-1.106c-.386-.438-.76-.92-1.107-1.436-1.367-2.032-2.17-4.186-2.17-6.005 0-3.07 2.475-5.5 5.5-5.5 1.62 0 3.04.705 4.014 1.82C15.79 3.555 17.21 2.855 18.83 2.855c3.025 0 5.5 2.43 5.5 5.5 0 1.82-.803 3.973-2.169 6.005-.347.515-.721.998-1.107 1.436-.37.417-.76.806-1.16 1.106l-.02.01-.004.002A2.25 2.25 0 019.653 16.915z" />
                                        </svg>
                                        {reel.likes}
                                    </span>
                                </div>
                            </div>

                            {/* Instagram Icon */}
                            <div className="absolute top-3 right-3">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                </svg>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
