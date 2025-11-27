import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get('placeId');
    const address = searchParams.get('address');
    const name = searchParams.get('name');

    if (!placeId && !address && !name) {
        return NextResponse.json(
            { error: 'Please provide placeId, address, or name' },
            { status: 400 }
        );
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        return NextResponse.json(
            { error: 'Google Places API key not configured' },
            { status: 500 }
        );
    }

    try {
        let finalPlaceId = placeId;

        // If no placeId provided, search for it using address or name
        if (!finalPlaceId && (address || name)) {
            const searchQuery = (address || name) as string;
            const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id&key=${apiKey}`;
            
            const searchResponse = await fetch(searchUrl);
            const searchData = await searchResponse.json();

            if (searchData.status === 'OK' && searchData.candidates?.[0]?.place_id) {
                finalPlaceId = searchData.candidates[0].place_id;
            } else {
                return NextResponse.json(
                    { error: 'Place not found', details: searchData },
                    { status: 404 }
                );
            }
        }

        // Fetch place details including reviews
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${finalPlaceId}&fields=name,formatted_address,formatted_phone_number,website,opening_hours,rating,user_ratings_total,reviews,photos,geometry,url&key=${apiKey}`;
        
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();

        if (detailsData.status === 'OK') {
            return NextResponse.json({
                success: true,
                placeId: finalPlaceId,
                data: detailsData.result
            });
        } else {
            return NextResponse.json(
                { error: 'Failed to fetch place details', details: detailsData },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error fetching place details:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
