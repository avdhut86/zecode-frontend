import Link from "next/link";
import { MOCK_DATA } from "@/lib/mock-data";
import type { Category } from "@/lib/directus";

interface CategoryGridProps {
  categories?: Category[];
}

export default function CategoryGrid({ categories }: CategoryGridProps) {
    // Use provided categories or fallback to MOCK_DATA
    const displayCategories = categories && categories.length > 0 
        ? categories 
        : MOCK_DATA.categories.map(cat => ({
            id: cat.id,
            title: cat.title,
            slug: cat.title.toLowerCase(),
            image: cat.image,
            link: cat.link,
            subcategories: cat.subcategories
        }));
    return (
        <section style={{ padding: '80px 0', margin: 0, width: '100%', backgroundColor: '#ffffff' }}>
            {/* Section Header */}
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 32px 56px' }}>
                <h2 style={{ 
                    fontSize: '48px', 
                    fontWeight: '700', 
                    textAlign: 'center', 
                    marginBottom: '16px', 
                    color: '#000000',
                    fontFamily: '"DIN Condensed", "League Gothic", system-ui, sans-serif',
                    letterSpacing: '2px',
                    textTransform: 'uppercase'
                }}>
                    Shop By Category
                </h2>
                <p style={{ fontSize: '18px', textAlign: 'center', color: '#666666', maxWidth: '600px', margin: '0 auto', fontWeight: '400', letterSpacing: '0.3px' }}>
                    Discover our curated collections for men, women, and kids. Urban fashion that defines your style.
                </p>
            </div>

            {/* Category Grid */}
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 32px' }}>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '32px'
                }}>
                    {displayCategories.map((cat) => (
                        <Link
                            key={cat.id}
                            href={cat.link}
                            className="group"
                            style={{ 
                                position: 'relative',
                                display: 'block',
                                height: '500px',
                                overflow: 'hidden',
                                borderRadius: '12px',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                            }}
                        >
                            {/* Background Image using img tag */}
                            <img
                                src={cat.image}
                                alt={cat.title}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    transition: 'transform 0.7s ease'
                                }}
                                className="group-hover:scale-105"
                            />

                            {/* Overlay */}
                            <div 
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                                    transition: 'background-color 0.3s ease'
                                }}
                                className="group-hover:bg-black/60"
                            ></div>

                            {/* Content */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '32px',
                                zIndex: 10
                            }}>
                                <h3 
                                    className="font-din group-hover:tracking-widest"
                                    style={{
                                        fontSize: '72px',
                                        fontWeight: '700',
                                        color: '#ffffff',
                                        textTransform: 'uppercase',
                                        letterSpacing: '-0.05em',
                                        marginBottom: '16px',
                                        transition: 'letter-spacing 0.5s ease',
                                        textAlign: 'center'
                                    }}
                                >
                                    {cat.title}
                                </h3>
                                <p style={{ 
                                    color: '#ffffff', 
                                    fontSize: '16px', 
                                    textAlign: 'center', 
                                    opacity: 0.9,
                                    fontWeight: '500'
                                }}>
                                    Explore Collection
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
