import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import zlib from 'zlib';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const gunzip = promisify(zlib.gunzip);

function loadFallbackMetadata() {
    try {
        const filePath = path.join(process.cwd(), 'public', 'cutoffs-data.json');
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, 'utf-8');
            const { lookup } = JSON.parse(raw);
            return {
                institutes: lookup.C || [],
                branches: lookup.P || [],
                categories: lookup.T || [],
                quotas: ['Home State', 'All India'],
                seat_types: lookup.S || [],
                years: [...(lookup.Y || [])].sort((a: number, b: number) => b - a),
                rounds: lookup.R || [],
            };
        }
    } catch (err) {
        console.error('Failed to load fallback metadata from cutoffs-data.json:', err);
    }
    return null;
}

// Initialize Redis client with environment validation
const getRedisClient = () => {
    try {
        // Check if Redis environment variables are available
        if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
            console.warn('[Metadata API] Redis credentials not found in environment');
            return null;
        }
        return Redis.fromEnv();
    } catch (error) {
        console.error('[Metadata API] Failed to initialize Redis:', error);
        return null;
    }
};

const redis = getRedisClient();

/**
 * GET /api/predictor/metadata
 * Returns filter metadata (unique institutes, branches, categories, etc.)
 * for instant filter display without needing to search first
 */
export async function GET() {
    try {
        // If Redis is not available, try local fallback
        if (!redis) {
            const fallback = loadFallbackMetadata();
            if (fallback) {
                return NextResponse.json(fallback, {
                    headers: {
                        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
                    }
                });
            }
            console.error('[Metadata API] Redis not available - check environment variables');
            return NextResponse.json(
                { error: 'Database connection not configured' },
                { status: 503 }
            );
        }

        // Try to get cached metadata
        const cachedMetadata = await redis.get('wbjee:metadata');

        if (cachedMetadata) {
            // Upstash Redis sometimes auto-parses JSON, check type
            if (typeof cachedMetadata === 'string') {
                return NextResponse.json(JSON.parse(cachedMetadata));
            } else {
                // Already an object
                return NextResponse.json(cachedMetadata);
            }
        }

        // If metadata doesn't exist, build it from master data
        const masterDataRaw = await redis.get('wbjee:master_data');

        if (!masterDataRaw) {
            const fallback = loadFallbackMetadata();
            if (fallback) {
                return NextResponse.json(fallback, {
                    headers: {
                        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
                    }
                });
            }
            return NextResponse.json(
                { error: 'Master data not available' },
                { status: 500 }
            );
        }

        // Handle gzip compression
        let masterData;
        if (typeof masterDataRaw === 'string' && masterDataRaw.startsWith('H4sI')) {
            // Decompress gzip data
            const buffer = Buffer.from(masterDataRaw, 'base64');
            const decompressed = await gunzip(buffer);
            masterData = JSON.parse(decompressed.toString('utf-8'));
        } else if (typeof masterDataRaw === 'string') {
            masterData = JSON.parse(masterDataRaw);
        } else {
            masterData = masterDataRaw;
        }

        interface MasterDataRecord {
            institute: string;
            branch: string;
            category: string;
            quota: string;
            seat_type: string;
            year: number;
            round: string;
        }

        const typedData = masterData as MasterDataRecord[];

        // Extract unique values for each filter field
        const metadata = {
            institutes: [...new Set(typedData.map(r => r.institute))].filter(Boolean).sort(),
            branches: [...new Set(typedData.map(r => r.branch))].filter(Boolean).sort(),
            categories: [...new Set(typedData.map(r => r.category))].filter(Boolean).sort(),
            quotas: [...new Set(typedData.map(r => r.quota))].filter(Boolean).sort(),
            seat_types: [...new Set(typedData.map(r => r.seat_type).filter(Boolean))].sort(),
            years: [...new Set(typedData.map(r => r.year).filter(Boolean))].sort(),
            rounds: [...new Set(typedData.map(r => r.round))].filter(Boolean).sort()
        };

        // Cache metadata for future requests (6-month TTL)
        await redis.set('wbjee:metadata', JSON.stringify(metadata), {
            ex: 15552000  // 6 months in seconds (180 days)
        });

        return NextResponse.json(metadata, {
            headers: {
                // Edge cache: 1 day. stale-while-revalidate: 1 hour
                'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
            }
        });

    } catch (error) {
        console.error('Error fetching metadata:', error);
        return NextResponse.json(
            { error: 'Failed to fetch metadata' },
            { status: 500 }
        );
    }
}
