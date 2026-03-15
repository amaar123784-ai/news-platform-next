import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        // Get parameters from URL
        const title = searchParams.get('title') || 'صوت تهامة';
        const category = searchParams.get('category') || 'أخبار';
        const imageUrl = searchParams.get('imageUrl');
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://voiceoftihama.com';

        // Background image logic: use provided image or fallback to a branded gradient
        const background = imageUrl 
            ? `url(${imageUrl})` 
            : 'linear-gradient(to bottom right, #1e3a8a, #1e40af)';

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        justifyContent: 'flex-end',
                        backgroundImage: background,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundColor: '#111',
                        position: 'relative',
                        fontFamily: 'sans-serif', // Will use default system Arabic fonts if available
                    }}
                >
                    {/* Dark Overlay for readability */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.2) 100%)',
                        }}
                    />

                    {/* Logo / Brand Header */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 40,
                            right: 40,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                        }}
                    >
                        <div style={{
                            backgroundColor: '#2563eb',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            display: 'flex',
                        }}>
                            <span style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>صوت تهامة</span>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '0 60px 60px 60px',
                            width: '100%',
                            direction: 'rtl',
                        }}
                    >
                        {/* Category Badge */}
                        <div
                            style={{
                                backgroundColor: '#2563eb',
                                color: 'white',
                                padding: '6px 16px',
                                borderRadius: '20px',
                                fontSize: 20,
                                fontWeight: 600,
                                marginBottom: 20,
                                alignSelf: 'flex-start',
                            }}
                        >
                            {category}
                        </div>

                        {/* Article Title */}
                        <div
                            style={{
                                fontSize: 52,
                                fontWeight: 800,
                                color: 'white',
                                lineHeight: 1.2,
                                marginBottom: 10,
                                textShadow: '0 4px 8px rgba(0,0,0,0.5)',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                            }}
                        >
                            {title}
                        </div>

                        {/* Footer URL */}
                        <div style={{ display: 'flex', marginTop: 20, opacity: 0.8 }}>
                            <span style={{ color: '#cbd5e1', fontSize: 18 }}>voiceoftihama.com</span>
                        </div>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    } catch (e: any) {
        console.log(`${e.message}`);
        return new Response(`Failed to generate the image`, {
            status: 500,
        });
    }
}
