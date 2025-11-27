import Link from "next/link";
import PageHeader from "@/components/PageHeader";

interface Subcategory {
    id: number;
    title: string;
    image: string;
    link: string;
}

interface SubcategoryGridProps {
    title: string;
    subcategories: Subcategory[];
    pageKey?: string;
}

export default function SubcategoryGrid({ title, subcategories, pageKey }: SubcategoryGridProps) {
    // Generate pageKey from title if not provided
    const key = pageKey || title.toLowerCase().replace(/\s+/g, '-');
    
    return (
        <section style={{ margin: 0, width: '100%', backgroundColor: '#ffffff' }}>
            {/* Section Header - Using PageHeader for uniformity */}
            <PageHeader 
                pageKey={key} 
                defaultTitle={title} 
                subtitle="Explore our collection and find your style" 
            />

            {/* Subcategory Grid */}
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '56px 32px' }}>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '32px'
                }}>
                    {subcategories.map((subcat) => (
                        <Link
                            key={subcat.id}
                            href={subcat.link}
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
                            {/* Background Image */}
                            <img
                                src={subcat.image}
                                alt={subcat.title}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    transition: 'transform 0.7s ease'
                                }}
                                className="group-hover:scale-110"
                            />

                            {/* Overlay */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)',
                                transition: 'background 0.3s ease'
                            }} 
                            className="group-hover:bg-opacity-80"
                            />

                            {/* Content */}
                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                padding: '32px',
                                zIndex: 10
                            }}>
                                <h3 style={{
                                    fontSize: '72px',
                                    fontWeight: '700',
                                    color: '#ffffff',
                                    margin: '0 0 12px 0',
                                    fontFamily: '"DIN Condensed", "League Gothic", system-ui, sans-serif',
                                    letterSpacing: '2px',
                                    lineHeight: '1',
                                    textTransform: 'uppercase'
                                }}>
                                    {subcat.title}
                                </h3>
                                <p style={{
                                    fontSize: '16px',
                                    color: '#ffffff',
                                    margin: 0,
                                    fontWeight: '500',
                                    letterSpacing: '1px'
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
