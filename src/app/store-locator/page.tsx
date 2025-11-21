"use client";
import { useState } from "react";
import Image from "next/image";

export default function StoreLocatorPage() {
    const [searchQuery, setSearchQuery] = useState("");

    // Enhanced mock data to match the visual layout (Images, Ratings, Status)
    // Content (Name, Address, Contact) is from Zecode
    const stores = [
        {
            city: "Bengaluru",
            name: "ZECODE Hesaraghatta",
            address: "01, Bagalakunte, 1st cross, Hesarghatta Road, MEI Layout, Opposite BBMP Office, Bengaluru, Karnataka 560073",
            email: "hessargatta@zecode.com",
            phone: "+91-8657039305",
            image: "/hero-bg.jpg", // Placeholder
            rating: 4.5,
            status: "Open",
            closingTime: "10:00 PM"
        },
        {
            city: "Bengaluru",
            name: "ZECODE RT Nagar",
            address: "169, Matadahalli, Further Extension High Division, Near Indian Oil Petrol Pump, RT Nagar Main Road, MLA Layout, Krishnappa Block, Ganganagar, Bengaluru, Karnataka 560032",
            email: "rtnagar@zecode.com",
            phone: "+91-8657039306",
            image: "/hero-bg.jpg",
            rating: 4.2,
            status: "Open",
            closingTime: "9:30 PM"
        },
        {
            city: "Bengaluru",
            name: "ZECODE RR Nagar",
            address: "34/4A, Uttarahalli Main Road, Near RNS college next to Prince Royal Hotel, Channasandra, Kengeri, Bengaluru, Karnataka 560098",
            email: "rrnagar@zecode.com",
            phone: "+91-8657039309",
            image: "/hero-bg.jpg",
            rating: 4.8,
            status: "Open",
            closingTime: "10:00 PM"
        },
        {
            city: "Bengaluru",
            name: "ZECODE Sambhram College Road",
            address: "Patel Arcade, 14, Kanshiram Nagara, Sadguru Layout, Lashmipura Main Road, Vaderhalli, Bengaluru, Karnataka 560097",
            email: "sambhramcollege@zecode.com",
            phone: "+91-8657039302",
            image: "/hero-bg.jpg",
            rating: 4.0,
            status: "Open",
            closingTime: "9:00 PM"
        },
        {
            city: "Bengaluru",
            name: "ZECODE Vidyaranyapura",
            address: "960, Prithvi Arcade, Next to Paakashala, Vidyaranyapura Main Rd, BEL Layout 2nd Block, Chamundeswari Layout, Vidyaranyapura, Bengaluru, Karnataka 560097",
            email: "vidyaranyapura@zecode.com",
            phone: "+91-8657039301",
            image: "/hero-bg.jpg",
            rating: 4.6,
            status: "Open",
            closingTime: "10:00 PM"
        },
        {
            city: "Bengaluru",
            name: "ZECODE Yelahanka",
            address: "16, 1st A Main Rd, MIG B Sector, Yelahanka Satellite Town, Yelahanka, Bengaluru, Karnataka 560064",
            email: "yelahanka@zecode.com",
            phone: "+91-8657039310",
            image: "/hero-bg.jpg",
            rating: 4.3,
            status: "Open",
            closingTime: "9:30 PM"
        },
        {
            city: "Davangere",
            name: "ZECODE Davangere",
            address: "3370/19, Shamanur Rd, opp. to Lakshmi Flour Mill, MCC B Block, Kuvempu Nagar, Davanagere, Karnataka 577004",
            email: "davanagere@zecode.com",
            phone: "+91-6360810727",
            image: "/hero-bg.jpg",
            rating: 4.7,
            status: "Open",
            closingTime: "10:00 PM"
        },
        {
            city: "Bengaluru",
            name: "ZECODE Kammanahalli",
            address: "307, 7th Main Rd, HRBR Layout 2nd Block, HRBR Layout, Kalyan Nagar, Bengaluru, Karnataka 560043",
            email: "kammanahalli@zecode.com",
            phone: "+91-8657039307",
            image: "/hero-bg.jpg",
            rating: 4.1,
            status: "Open",
            closingTime: "9:30 PM"
        },
        {
            city: "Nelamangala",
            name: "ZECODE Nelamangala",
            address: "135/38/39/40, BH Rd, beside Vishal Mega Mart, Vinayaka Nagar, Sadashiva Nagara, Nelamangala, Nagarur, Karnataka 562123",
            email: "nelamangala@zecode.com",
            phone: "+91-8425840412",
            image: "/hero-bg.jpg",
            rating: 4.4,
            status: "Open",
            closingTime: "9:00 PM"
        },
        {
            city: "Bengaluru",
            name: "ZECODE HSR Layout",
            address: "1667/A, 14th Main Rd, Sector 7, HSR Layout, Bengaluru, Karnataka 560102",
            email: "hsrlayout@zecode.com",
            phone: "+91-8425840441",
            image: "/hero-bg.jpg",
            rating: 4.9,
            status: "Open",
            closingTime: "10:00 PM"
        },
        {
            city: "Bengaluru",
            name: "ZECODE Vignan Nagar",
            address: "No 1 & 2, Malleshpalya Main Rd, next to Zudio, Vignan Nagar, Doddanekkundi, Bengaluru, Karnataka 560075",
            email: "vignananagar@zecode.com",
            phone: "+91-8425840442",
            image: "/hero-bg.jpg",
            rating: 4.2,
            status: "Open",
            closingTime: "9:30 PM"
        },
        {
            city: "Ballari",
            name: "ZECODE Ballari",
            address: "Near Rock Garden Hotel beside Petrol Pump, Infantry Road, Hospet Rd, Sanjay Gandhi Nagar, Ballari, Karnataka 583101",
            email: "bellary@zecode.com",
            phone: "+91-9152977456",
            image: "/hero-bg.jpg",
            rating: 4.5,
            status: "Open",
            closingTime: "10:00 PM"
        },
        {
            city: "Bengaluru",
            name: "ZECODE Nagavara",
            address: "14th Cross Rd, beside IBIS, opposite Manyata Tech Park Road, Chanyakya Layout, Vyalikaval HBCS Layout, Nagavara, Bengaluru, Karnataka 560045",
            email: "customercare@zecode.com",
            phone: "+91-9152977456",
            image: "/hero-bg.jpg",
            rating: 4.3,
            status: "Open",
            closingTime: "9:30 PM"
        },
        {
            city: "Bengaluru",
            name: "ZECODE TC Palya Road",
            address: "No.19 & 20, Thambu Chetty Palya Main Rd, Akshaya Nagar 2nd Block, Akshya Nagar, Ramamurthy Nagar, Bengaluru, Karnataka 560016",
            email: "sm.tcpalya@zecode.com",
            phone: "+91-9152977456",
            image: "/hero-bg.jpg",
            rating: 4.0,
            status: "Open",
            closingTime: "9:00 PM"
        },
        {
            city: "Bengaluru",
            name: "ZECODE Basaveshwar Nagar",
            address: "1st Block, 457, Chord Rd, next to Cadambi College, 3rd Stage, Basaveshwar Nagar, Bengaluru, Karnataka 560079",
            email: "basveshwar.nagar@zecode.com",
            phone: "+91-8425840470",
            image: "/hero-bg.jpg",
            rating: 4.6,
            status: "Open",
            closingTime: "10:00 PM"
        },
        {
            city: "Bengaluru",
            name: "ZECODE Warehouse",
            address: "Plot N, 2J-2K 3RD PHASE, 3rd Phase, KIADB Obedenahalli, Industrial Area, Doddaballapura, Bengaluru, Karnataka 561203",
            email: "customercare@zecode.com",
            phone: "+91-9152977456",
            image: "/hero-bg.jpg",
            rating: 4.8,
            status: "Open",
            closingTime: "6:00 PM"
        },
        {
            city: "Chitradurga",
            name: "ZECODE Chitradurga",
            address: "Ward No. 23, Gumastara Colony, PB Rd, 1st Cross Road, Block No. 01, opp. Karnataka Petrol Bunk, Chitradurga, Karnataka 577501",
            email: "chitradurga@zecode.com",
            phone: "+91-9152977456",
            image: "/hero-bg.jpg",
            rating: 4.2,
            status: "Open",
            closingTime: "9:00 PM"
        },
        {
            city: "Mandya",
            name: "ZECODE Mandya",
            address: "D2/1378/196, Mysore Rd, near P.E.S College Campus, Bandigowda Layout, Shankar Pura, Mandya, Karnataka 571401",
            email: "mandya@zecode.com",
            phone: "+91-9152977456",
            image: "/hero-bg.jpg",
            rating: 4.4,
            status: "Open",
            closingTime: "9:30 PM"
        },
        {
            city: "Hassan",
            name: "ZECODE Hassan",
            address: "Bangalore - Mangalore Rd, next to Girias, opp. jewel rock hotel, Krishnaraja Pura, Hassan, Karnataka 573201",
            email: "hassan@zecode.com",
            phone: "+91-9152977456",
            image: "/hero-bg.jpg",
            rating: 4.1,
            status: "Open",
            closingTime: "9:00 PM"
        },
        {
            city: "Hubballi",
            name: "ZECODE Hubballi",
            address: "CTS No. 4647, Plot No. 23, opp. More Super Market, Shirur Park, 1st Stage, Vidya Nagar, Hubballi, Karnataka 580021",
            email: "hubli@zecode.com",
            phone: "+91-9152977456",
            image: "/hero-bg.jpg",
            rating: 4.5,
            status: "Open",
            closingTime: "10:00 PM"
        },
        {
            city: "Bengaluru",
            name: "ZECODE Royal Meenakshi Mall",
            address: "2nd Floor, Royal Meenakshi Mall, Shop No, S012, Bannerghatta Rd, opp. Meenakshi Temple, Bengaluru, Karnataka 560076",
            email: "rmm@zecode.com",
            phone: "+91-9152977456",
            image: "/hero-bg.jpg",
            rating: 4.7,
            status: "Open",
            closingTime: "10:00 PM"
        },
        {
            city: "Mysuru",
            name: "ZECODE Mysore",
            address: "Hegde Square, NS Road, Devaraja Mohalla, Shivarampet, Mysuru, Karnataka 570001",
            email: "mysore@zecode.com",
            phone: "+91-9152977456",
            image: "/hero-bg.jpg",
            rating: 4.3,
            status: "Open",
            closingTime: "9:30 PM"
        },
        {
            city: "Bengaluru",
            name: "ZECODE GT World Mall",
            address: "First Floor, Gt Mall, Shop No. FF-11,12,13, 92, Magadi Main Rd, next to Prasanna Theatre, Bengaluru, Karnataka 560023",
            email: "gtmall@zecode.com",
            phone: "+91-9152977456",
            image: "/hero-bg.jpg",
            rating: 4.0,
            status: "Open",
            closingTime: "10:00 PM"
        },
        {
            city: "Mangaluru",
            name: "ZECODE Mangaluru",
            address: "Opposite Mangalore University College, Bhavathi, Hampankatta, Mangaluru, Karnataka 575001",
            email: "mangalore@zecode.com",
            phone: "+91-9152977456",
            image: "/hero-bg.jpg",
            rating: 4.6,
            status: "Open",
            closingTime: "9:30 PM"
        },
        {
            city: "Tumakuru",
            name: "ZECODE Tumkur",
            address: "PID: 19852, BH-4, opp. to SIDDAGANGA INSTITUTE OF TECHNOLOGY, Valmiki Nagar, Batawadi, Tumakuru, Karnataka 572103",
            email: "tumkur@zecode.com",
            phone: "+91-9152977456",
            image: "/hero-bg.jpg",
            rating: 4.2,
            status: "Open",
            closingTime: "9:00 PM"
        },
        {
            city: "Bengaluru",
            name: "ZECODE Begur",
            address: "Begur Rd, opposite Seva Health Care Center, Hongasandra, Bengaluru, Karnataka 560068",
            email: "begur@zecode.com",
            phone: "+91-9152977456",
            image: "/hero-bg.jpg",
            rating: 4.1,
            status: "Open",
            closingTime: "9:00 PM"
        }
    ];

    const filteredStores = stores.filter(store =>
        store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <main className="min-h-screen bg-gray-50">
            {/* Hero / Search Section */}
            <div className="relative h-64 bg-gray-900 flex items-center justify-center">
                <Image
                    src="/hero-bg.jpg"
                    alt="Store Locator"
                    fill
                    className="object-cover opacity-40"
                />
                <div className="relative z-10 w-full max-w-2xl px-4 text-center">
                    <h1 className="font-din text-4xl md:text-5xl font-bold uppercase text-white mb-6 tracking-wide">
                        Find a Store Near You
                    </h1>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Search by city or locality..."
                            className="flex-1 px-6 py-3 rounded-sm focus:outline-none text-black"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button className="bg-brand-red text-white px-8 py-3 font-bold uppercase rounded-sm hover:bg-red-700 transition-colors">
                            Search
                        </button>
                    </div>
                </div>
            </div>

            {/* Stores Grid */}
            <div className="container mx-auto px-4 py-12 max-w-7xl">
                <h2 className="font-din text-2xl font-bold mb-8 text-gray-800">
                    {filteredStores.length} Stores Found
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredStores.map((store) => (
                        <div key={store.name} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                            {/* Store Image */}
                            <div className="relative h-48 w-full bg-gray-200">
                                <Image
                                    src={store.image}
                                    alt={store.name}
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                    <span className="text-yellow-500">★</span> {store.rating}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <h3 className="font-din text-lg font-bold text-gray-900 mb-1 truncate" title={store.name}>
                                    {store.name}
                                </h3>
                                <p className="text-xs text-gray-500 mb-3 line-clamp-2 h-8" title={store.address}>
                                    {store.address}
                                </p>

                                <div className="flex items-center gap-2 text-xs text-green-600 font-bold mb-4">
                                    <span className="w-2 h-2 rounded-full bg-green-600"></span>
                                    Today - Open until {store.closingTime}
                                </div>

                                <div className="pt-3 border-t border-gray-100">
                                    <button className="text-blue-600 text-sm font-bold hover:underline">
                                        Get Directions
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
