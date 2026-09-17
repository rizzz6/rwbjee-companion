/**
 * Edge Case Tests for Static Slicing Implementation
 * Run with: tsx scripts/test-static-slicing.ts
 */

import fs from 'fs';
import path from 'path';
import { decodeColumnarData, encodeColumnarData, createSlug, type Cutoff } from '../../src/utils/compression/cutoff-decoder';

console.log('🧪 Running Static Slicing Edge Case Tests\\n');

let passedTests = 0;
let failedTests = 0;

function test(name: string, fn: () => void) {
    try {
        fn();
        console.log(`✅ ${name}`);
        passedTests++;
    } catch (error) {
        console.error(`❌ ${name}`);
        console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
        failedTests++;
    }
}

// Test 1: Slug Generation Edge Cases
console.log('📝 Testing Slug Generation\\n');

test('Slug: Normal college name', () => {
    const slug = createSlug('Jadavpur University');
    if (slug !== 'jadavpur-university') throw new Error(`Expected 'jadavpur-university', got '${slug}'`);
});

test('Slug: Special characters', () => {
    const slug = createSlug('St. Thomas College of Engineering & Technology, Khidirpur, Kolkata');
    if (slug !== 'st-thomas-college-of-engineering-technology-khidirpur-kolkata') {
        throw new Error(`Unexpected slug: ${slug}`);
    }
});

test('Slug: Multiple spaces', () => {
    const slug = createSlug('College   with    spaces');
    if (slug !== 'college-with-spaces') throw new Error(`Expected 'college-with-spaces', got '${slug}'`);
});

test('Slug: Leading/trailing hyphens', () => {
    const slug = createSlug('-College Name-');
    if (slug !== 'college-name') throw new Error(`Expected 'college-name', got '${slug}'`);
});

test('Slug: Numbers and parentheses', () => {
    const slug = createSlug('College (2024) - Campus 2');
    if (slug !== 'college-2024-campus-2') throw new Error(`Unexpected slug: ${slug}`);
});

test('Slug: Empty string', () => {
    const slug = createSlug('');
    if (slug !== '') throw new Error(`Expected empty string, got '${slug}'`);
});

// Test 2: Encoding/Decoding Round Trip
console.log('\\n📝 Testing Encoding/Decoding\\n');

test('Encode/Decode: Round trip with college', () => {
    const original: Cutoff[] = [
        {
            college: 'Test College',
            program: 'CSE',
            year: 2024,
            category: 'OBC-A',
            round: 'Round 1',
            seatType: 'WBJEE Seats',
            opening: 1000,
            closing: 2000
        },
        {
            college: 'Test College',
            program: 'ECE',
            year: 2024,
            category: 'SC',
            round: 'Round 2',
            seatType: 'JEE(Main) Seats',
            opening: 3000,
            closing: 4000
        }
    ];

    const encoded = encodeColumnarData(original, true);
    const decoded = decodeColumnarData(encoded);

    if (decoded.length !== original.length) {
        throw new Error(`Length mismatch: ${decoded.length} vs ${original.length}`);
    }

    // Check first record
    if (decoded[0].college !== original[0].college) throw new Error('College mismatch');
    if (decoded[0].program !== original[0].program) throw new Error('Program mismatch');
    if (decoded[0].opening !== original[0].opening) throw new Error('Opening rank mismatch');
});

test('Encode/Decode: Round trip without college', () => {
    const original: Cutoff[] = [
        {
            program: 'CSE',
            year: 2024,
            category: 'OBC-A',
            round: 'Round 1',
            seatType: 'WBJEE Seats',
            opening: 1000,
            closing: 2000
        }
    ];

    const encoded = encodeColumnarData(original, false);
    const decoded = decodeColumnarData(encoded);

    if (decoded[0].college !== undefined) throw new Error('College should be undefined');
    if (decoded[0].program !== 'CSE') throw new Error('Program mismatch');
});

test('Encode/Decode: Empty array', () => {
    const original: Cutoff[] = [];
    const encoded = encodeColumnarData(original, true);
    const decoded = decodeColumnarData(encoded);

    if (decoded.length !== 0) throw new Error('Should return empty array');
});

test('Encode/Decode: Large dataset', () => {
    const original: Cutoff[] = [];
    for (let i = 0; i < 1000; i++) {
        original.push({
            college: `College ${i % 10}`,
            program: `Program ${i % 5}`,
            year: 2020 + (i % 5),
            category: ['OBC-A', 'SC', 'ST', 'OPEN'][i % 4],
            round: `Round ${(i % 3) + 1}`,
            seatType: i % 2 === 0 ? 'WBJEE Seats' : 'JEE(Main) Seats',
            opening: 1000 + i,
            closing: 2000 + i
        });
    }

    const encoded = encodeColumnarData(original, true);
    const decoded = decodeColumnarData(encoded);

    if (decoded.length !== 1000) throw new Error(`Expected 1000 records, got ${decoded.length}`);
    if (decoded[500].opening !== 1500) throw new Error('Data corruption detected');
});

// Test 3: File System Validation
console.log('\\n📝 Testing Generated Files\\n');

test('Files: mobile-index.json exists', () => {
    const indexPath = path.join(process.cwd(), 'public', 'data', 'mobile-index.json');
    if (!fs.existsSync(indexPath)) throw new Error('mobile-index.json not found');
});

test('Files: mobile-index.json is valid JSON', () => {
    const indexPath = path.join(process.cwd(), 'public', 'data', 'mobile-index.json');
    const content = fs.readFileSync(indexPath, 'utf-8');
    const data = JSON.parse(content);
    if (!data.colleges || !data.slugs) throw new Error('Invalid index structure');
    if (data.colleges.length !== data.slugs.length) throw new Error('Colleges and slugs length mismatch');
});

test('Files: All slugs are unique', () => {
    const indexPath = path.join(process.cwd(), 'public', 'data', 'mobile-index.json');
    const data = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    const uniqueSlugs = new Set(data.slugs);
    if (uniqueSlugs.size !== data.slugs.length) {
        throw new Error(`Duplicate slugs found: ${data.slugs.length} total, ${uniqueSlugs.size} unique`);
    }
});

test('Files: colleges directory exists', () => {
    const collegesDir = path.join(process.cwd(), 'public', 'data', 'colleges');
    if (!fs.existsSync(collegesDir)) throw new Error('colleges directory not found');
});

test('Files: All slugs have corresponding files', () => {
    const indexPath = path.join(process.cwd(), 'public', 'data', 'mobile-index.json');
    const data = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    const collegesDir = path.join(process.cwd(), 'public', 'data', 'colleges');

    const missingFiles: string[] = [];
    for (const slug of data.slugs) {
        const filePath = path.join(collegesDir, `${slug}.json`);
        if (!fs.existsSync(filePath)) {
            missingFiles.push(slug);
        }
    }

    if (missingFiles.length > 0) {
        throw new Error(`Missing files for slugs: ${missingFiles.join(', ')}`);
    }
});

test('Files: No empty slice files', () => {
    const collegesDir = path.join(process.cwd(), 'public', 'data', 'colleges');
    const files = fs.readdirSync(collegesDir);

    const emptyFiles: string[] = [];
    for (const file of files) {
        const filePath = path.join(collegesDir, file);
        const stats = fs.statSync(filePath);
        if (stats.size === 0) {
            emptyFiles.push(file);
        }
    }

    if (emptyFiles.length > 0) {
        throw new Error(`Empty files found: ${emptyFiles.join(', ')}`);
    }
});

test('Files: No undefined.json file', () => {
    const collegesDir = path.join(process.cwd(), 'public', 'data', 'colleges');
    const undefinedPath = path.join(collegesDir, 'undefined.json');
    if (fs.existsSync(undefinedPath)) {
        throw new Error('undefined.json file exists');
    }
});

test('Files: Sample slice has valid structure', () => {
    const indexPath = path.join(process.cwd(), 'public', 'data', 'mobile-index.json');
    const data = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    const firstSlug = data.slugs[0];

    const slicePath = path.join(process.cwd(), 'public', 'data', 'colleges', `${firstSlug}.json`);
    const sliceContent = fs.readFileSync(slicePath, 'utf-8');
    const slice = JSON.parse(sliceContent);

    if (!slice.lookup) throw new Error('Missing lookup table');
    if (!slice.data) throw new Error('Missing data table');
    if (!slice.lookup.P) throw new Error('Missing programs in lookup');
    if (!slice.data.p) throw new Error('Missing program indices in data');
});

test('Files: Slice can be decoded', () => {
    const indexPath = path.join(process.cwd(), 'public', 'data', 'mobile-index.json');
    const data = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    const firstSlug = data.slugs[0];

    const slicePath = path.join(process.cwd(), 'public', 'data', 'colleges', `${firstSlug}.json`);
    const slice = JSON.parse(fs.readFileSync(slicePath, 'utf-8'));

    const decoded = decodeColumnarData(slice);
    if (decoded.length === 0) throw new Error('Decoded data is empty');
    if (!decoded[0].program) throw new Error('Missing program in decoded data');
    if (!decoded[0].year) throw new Error('Missing year in decoded data');
});

test('Files: All slices are under 50KB', () => {
    const collegesDir = path.join(process.cwd(), 'public', 'data', 'colleges');
    const files = fs.readdirSync(collegesDir);

    const largeFiles: string[] = [];
    for (const file of files) {
        const filePath = path.join(collegesDir, file);
        const stats = fs.statSync(filePath);
        if (stats.size > 50 * 1024) {
            largeFiles.push(`${file} (${(stats.size / 1024).toFixed(2)}KB)`);
        }
    }

    if (largeFiles.length > 0) {
        throw new Error(`Files exceeding 50KB: ${largeFiles.join(', ')}`);
    }
});

// Test 4: Data Integrity
console.log('\\n📝 Testing Data Integrity\\n');

test('Data: Jadavpur University slice exists', () => {
    const jadavpurPath = path.join(process.cwd(), 'public', 'data', 'colleges', 'jadavpur-university.json');
    if (!fs.existsSync(jadavpurPath)) throw new Error('Jadavpur University slice not found');
});

test('Data: Jadavpur has CSE program', () => {
    const jadavpurPath = path.join(process.cwd(), 'public', 'data', 'colleges', 'jadavpur-university.json');
    const slice = JSON.parse(fs.readFileSync(jadavpurPath, 'utf-8'));
    const decoded = decodeColumnarData(slice);

    const hasCSE = decoded.some(c => c.program.toUpperCase().includes('COMPUTER SCIENCE'));
    if (!hasCSE) throw new Error('Jadavpur should have Computer Science program');
});

test('Data: All records have required fields', () => {
    const indexPath = path.join(process.cwd(), 'public', 'data', 'mobile-index.json');
    const data = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    const firstSlug = data.slugs[0];

    const slicePath = path.join(process.cwd(), 'public', 'data', 'colleges', `${firstSlug}.json`);
    const slice = JSON.parse(fs.readFileSync(slicePath, 'utf-8'));
    const decoded = decodeColumnarData(slice);

    for (const record of decoded) {
        if (!record.program) throw new Error('Missing program');
        if (!record.year) throw new Error('Missing year');
        if (!record.category) throw new Error('Missing category');
        if (!record.round) throw new Error('Missing round');
        if (!record.seatType) throw new Error('Missing seatType');
        if (record.opening === undefined) throw new Error('Missing opening rank');
        if (record.closing === undefined) throw new Error('Missing closing rank');
    }
});

test('Data: Opening rank <= Closing rank', () => {
    const indexPath = path.join(process.cwd(), 'public', 'data', 'mobile-index.json');
    const data = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    const firstSlug = data.slugs[0];

    const slicePath = path.join(process.cwd(), 'public', 'data', 'colleges', `${firstSlug}.json`);
    const slice = JSON.parse(fs.readFileSync(slicePath, 'utf-8'));
    const decoded = decodeColumnarData(slice);

    for (const record of decoded) {
        if (record.opening > record.closing) {
            throw new Error(`Invalid ranks: opening ${record.opening} > closing ${record.closing}`);
        }
    }
});

// Summary
console.log('\\n' + '='.repeat(50));
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log('='.repeat(50));

if (failedTests > 0) {
    process.exit(1);
}

console.log('\\n🎉 All edge case tests passed!\\n');
