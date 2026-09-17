import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function appendVaryHeaders(response: NextResponse, headers: string[]) {
    const existing = response.headers.get('Vary');
    const varyValues = new Set(
        existing
            ? existing.split(',').map((value) => value.trim()).filter(Boolean)
            : []
    );

    headers.forEach((header) => varyValues.add(header));
    response.headers.set('Vary', Array.from(varyValues).join(', '));
}

function buildDeviceResponse(request: NextRequest, deviceType: 'desktop' | 'mobile') {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-device-type', deviceType);

    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });

    response.headers.set('x-device-type', deviceType);
    appendVaryHeaders(response, ['User-Agent', 'Save-Data']);

    return response;
}

export function middleware(request: NextRequest) {
    const userAgent = request.headers.get('user-agent') || '';

    // 1. Bot Detection (Critical for SEO)
    // Bots (Googlebot, etc.) need to see content immediately. Treat them as Desktop.
    // This must be the FIRST check.
    const isBot = /bot|googlebot|crawler|spider|robot|crawling|facebookexternalhit|twitterbot|whatsapp|slackbot|discordbot|telegrambot/i.test(userAgent);
    if (isBot) {
        return buildDeviceResponse(request, 'desktop');
    }

    // 2. Slow Network / Data Saver Detection
    // If user explicitly requests data savings, FORCE mobile (lazy) strategy
    const saveData = request.headers.get('save-data');
    const isSaveData = saveData === 'on';
    if (isSaveData) {
        return buildDeviceResponse(request, 'mobile');
    }

    // 3. Device Detection Strategy: Defensive Defaulting
    // Goal: Identify "Definitely Desktop". Everything else gets Mobile (Lazy).
    // Why? WhatsApp/In-App browsers often have weird UAs. Better to serve light 30KB
    // to a desktop than 184KB to a low-end phone.

    const isWindows = /Windows NT/i.test(userAgent);
    const isMac = /Macintosh/i.test(userAgent) && !/Mobile|iPhone|iPad|iPod/i.test(userAgent);
    const isLinuxDesktop = /X11;.*Linux/i.test(userAgent) && !/Android/i.test(userAgent);

    // iPad Pro often mimics Mac. We treat expensive tablets as Desktop.
    // Note: We cannot check navigator.maxTouchPoints in middleware (server-side).
    // We rely strictly on the User-Agent string.
    // Android tablets: Look for "Tablet" keyword OR Samsung Galaxy Tab models (SM-T, SM-P, etc.)
    const isTablet = /iPad|Tablet|SM-T\d+|SM-P\d+|Tab\s+\d+/i.test(userAgent);

    const isDefinitelyDesktop = isWindows || isMac || isLinuxDesktop || isTablet;
    const deviceType = isDefinitelyDesktop ? 'desktop' : 'mobile';

    return buildDeviceResponse(request, deviceType);
}

// Apply to cutoffs page only
export const config = {
    matcher: '/cutoffs',
};
