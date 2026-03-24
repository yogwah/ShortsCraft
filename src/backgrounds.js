// =============================================
// Background Image Preloader — ShortsCraft
// Loads beautiful photos from Unsplash for realistic backgrounds
// =============================================

// Curated Unsplash photo IDs for stunning backgrounds
const photoSources = {
    motivation: [
        'photo-1506744038136-46273834b3fb', // mountain lake
        'photo-1470071459604-3b5ec3a7fe05', // foggy forest
        'photo-1505144808419-1957a94ca61e', // golden sunset
        'photo-1472214103451-9374bd1c798e', // epic landscape
        'photo-1519681393784-d120267933ba', // starry mountains
        'photo-1500534314263-0869cef60c01', // mountain peak sunrise
        'photo-1507400492013-162706c8c05e', // sunset over water
        'photo-1504567961542-e24d9439a724', // ocean waves
        'photo-1490730141103-6cac27aaab94', // inspiring sky
        'photo-1469474968028-56623f02e42e', // golden landscape
        'photo-1433086966358-54859d0ed716', // waterfall
        'photo-1501854140801-50d01698950b', // autumn forest
    ],
    facts: [
        'photo-1451187580459-43490279c0fa', // earth from space
        'photo-1462331940025-496dfbfc7564', // nebula
        'photo-1444080748397-f442aa95c3e5', // dark stormy sky
        'photo-1507400492013-162706c8c05e', // dramatic sky
        'photo-1534796636912-3b95b3ab5986', // dark moody clouds
        'photo-1446776811953-b23d57bd21aa', // earth space
        'photo-1516339901601-2e1b62dc0c45', // lightning
        'photo-1465101162946-4377e57745c3', // galaxy
        'photo-1419242902214-272b3f66ee7a', // starry sky
        'photo-1543722530-d2c3201371e7', // northern lights
    ],
    tips: [
        'photo-1497366216548-37526070297c', // minimal desk
        'photo-1483058712412-4245e9b90334', // workspace
        'photo-1519389950473-47ba0277781c', // tech workspace
        'photo-1486312338219-ce68d2c6f44d', // laptop
        'photo-1517694712202-14dd9538aa97', // code on screen
        'photo-1484807352052-23338990c6c6', // notebook
        'photo-1522202176988-66273c2fd55f', // study
        'photo-1434030216411-0b793f4b4173', // desk writing
    ],
    trending: [
        'photo-1550684376-efcbd6e3f031', // neon lights
        'photo-1557682250-33bd709cbe85', // abstract gradient
        'photo-1558591710-4b4a1ae0f04d', // neon sign
        'photo-1531297484001-80022131f5a1', // tech display
        'photo-1526374965328-7f61d4dc18c5', // code matrix
        'photo-1535223289827-42f1e9919769', // digital art
        'photo-1550745165-9bc0b252726f', // phone screen
        'photo-1563089145-599997674d42', // abstract light
    ],
    poems: [
        'photo-1507003211169-0a1dd7228f2d', // misty mountains
        'photo-1518837695005-2083093ee35b', // rain on window
        'photo-1505682634904-d7c8d95cdc56', // sunset lake
        'photo-1475924156734-496f6cac6ec1', // autumn path
        'photo-1494500764479-0c8f2919a3d8', // night sky moon
        'photo-1508739773434-c26b3d09e071', // sunset clouds
        'photo-1431794062232-2a99a5431c6c', // mountain valley
        'photo-1470252649378-9c29740c9fa8', // misty forest
        'photo-1504700610630-ac6edd918aa0', // calm water
        'photo-1532274402911-5a369e4c4bb5', // foggy trees
    ]
};

// Image cache
const imageCache = new Map();
let preloadStarted = false;
let loadedCount = 0;
let totalCount = 0;

/**
 * Build URL from Unsplash photo ID
 */
function buildUrl(photoId) {
    return `https://images.unsplash.com/${photoId}?w=540&h=960&fit=crop&crop=center&q=75`;
}

/**
 * Load a single image
 */
function loadImage(photoId) {
    return new Promise((resolve) => {
        if (imageCache.has(photoId)) {
            resolve(imageCache.get(photoId));
            return;
        }
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            imageCache.set(photoId, img);
            loadedCount++;
            resolve(img);
        };
        img.onerror = () => {
            loadedCount++;
            resolve(null); // Graceful fail
        };
        img.src = buildUrl(photoId);
    });
}

/**
 * Preload all images for a category
 */
export async function preloadCategory(category) {
    const photos = photoSources[category] || photoSources.motivation;
    const promises = photos.map(id => loadImage(id));
    await Promise.all(promises);
}

/**
 * Preload ALL images in background (non-blocking)
 */
export function startPreloadAll() {
    if (preloadStarted) return;
    preloadStarted = true;

    const allPhotos = Object.values(photoSources).flat();
    totalCount = allPhotos.length;

    // Load in batches of 4 to not overwhelm the browser
    let index = 0;
    function loadNext() {
        const batch = allPhotos.slice(index, index + 4);
        if (batch.length === 0) return;
        index += 4;
        Promise.all(batch.map(id => loadImage(id))).then(() => {
            setTimeout(loadNext, 100); // Small delay between batches
        });
    }
    loadNext();
}

/**
 * Get a random preloaded image for a category
 * Returns the Image element or null if none available
 */
export function getRandomImage(category) {
    const photos = photoSources[category] || photoSources.motivation;
    // Shuffle and find first loaded
    const shuffled = [...photos].sort(() => Math.random() - 0.5);
    for (const id of shuffled) {
        const img = imageCache.get(id);
        if (img) return img;
    }
    // Try any loaded image
    for (const [, img] of imageCache) {
        if (img) return img;
    }
    return null;
}

/**
 * Get loading progress (0-100)
 */
export function getLoadProgress() {
    if (totalCount === 0) return 0;
    return Math.round((loadedCount / totalCount) * 100);
}

/**
 * Get all photo sources (for reference)
 */
export function getPhotoCategories() {
    return Object.keys(photoSources);
}
