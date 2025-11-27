import PageHeader from "@/components/PageHeader";

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-[#f5f5f5]">
            <PageHeader pageKey="about" defaultTitle="ABOUT ZECODE" subtitle="Our Story" />
            
            <div className="container mx-auto px-4 max-w-4xl py-12">
                <div className="prose prose-lg mx-auto text-gray-600">
                    <p className="lead text-xl text-black font-medium mb-6">
                        ZECODE is more than just a clothing brand; it's a movement. We are redefining urban fashion in India with styles that speak to the modern generation.
                    </p>

                    <p className="mb-6">
                        Born from a passion for street culture and contemporary design, ZECODE brings you collections that are bold, expressive, and unapologetically unique. Our mission is to empower you to find your own code—your own style language that sets you apart from the crowd.
                    </p>

                    <p>
                        With stores across major cities and a growing online presence, we are committed to delivering quality, comfort, and style in every piece we create. Welcome to the ZECODE family.
                    </p>
                </div>
            </div>
        </main>
    );
}
