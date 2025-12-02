import PageHeader from "@/components/PageHeader";
import { fetchPage } from "@/lib/directus";

// Force dynamic rendering to prevent build-time API calls
// Use ISR - revalidate every 5 minutes
export const revalidate = 300;

// Default content if CMS is unavailable
const DEFAULT_CONTENT = {
    lead: "ZECODE is more than just a clothing brand; it's a movement. We are redefining urban fashion in India with styles that speak to the modern generation.",
    body: [
        "Born from a passion for street culture and contemporary design, ZECODE brings you collections that are bold, expressive, and unapologetically unique. Our mission is to empower you to find your own code—your own style language that sets you apart from the crowd.",
        "With stores across major cities and a growing online presence, we are committed to delivering quality, comfort, and style in every piece we create. Welcome to the ZECODE family."
    ]
};

export default async function AboutPage() {
    // Try to fetch content from Directus CMS
    const page = await fetchPage("about");
    
    // Use CMS content or fallback to defaults
    const content = page?.content || null;
    const lead = page?.lead_text || DEFAULT_CONTENT.lead;
    const body = page?.body_text ? [page.body_text] : DEFAULT_CONTENT.body;

    return (
        <main className="min-h-screen bg-[#f5f5f5]">
            <PageHeader pageKey="about" defaultTitle="ABOUT ZECODE" subtitle="Our Story" />
            
            <div className="container mx-auto px-4 max-w-4xl py-12">
                <div className="prose prose-lg mx-auto text-gray-600">
                    {/* If we have rich HTML content from CMS, render it */}
                    {content ? (
                        <div dangerouslySetInnerHTML={{ __html: content }} />
                    ) : (
                        <>
                            <p className="lead text-xl text-black font-medium mb-6">
                                {lead}
                            </p>
                            {body.map((paragraph, index) => (
                                <p key={index} className="mb-6">
                                    {paragraph}
                                </p>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}

