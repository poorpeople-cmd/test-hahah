const { spawn } = require('child_process');
const { URL } = require('url');

// ==========================================
// 🎯 GITHUB INPUTS
// ==========================================
const STREAM_ID = process.env.STREAM_ID || '1';
const RAW_CMD = process.env.FFMPEG_CMD || '';
let inputUrl = process.env.M3U8_URL || '';
let refererUrl = process.env.REFERER_URL || '';

// 🔑 OK.RU KEYS YAHAN HARDCODED HAIN
const MULTI_KEYS = {
    '1': '14601603391083_14040893622891_puxzrwjniu',
    '2': '14601696583275_14041072274027_apdzpdb5xi',
    '3': '14617940008555_14072500914795_ohw67ls7ny',
    '4': '14601972227691_14041593547371_obdhgewlmq'
};
const RTMP_URL = `rtmp://vsu.okcdn.ru/input/${MULTI_KEYS[STREAM_ID]}`;

function formatPKT(timestampMs = Date.now()) {
    return new Date(timestampMs).toLocaleString('en-US', {
        timeZone: 'Asia/Karachi', hour12: true, year: 'numeric', month: 'short',
        day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    }) + " PKT";
}

console.log(`\n[🚀 MAIN] Project 11 Boot: ${formatPKT()}`);
console.log("-".repeat(60));

// ==========================================
// 🧠 SMART DETECTION (Full Command vs Direct Link)
// ==========================================
let finalHeaders = '';
let finalUserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36"; // Default UA

if (RAW_CMD && RAW_CMD.trim() !== '') {
    console.log("🧹 [MODE 1] Full FFmpeg Command detect hui. Parse kar raha hoon...");
    
    function extractArg(cmd, flag) {
        const regex = new RegExp(`${flag}\\s+("([^"]+)"|'([^']+)'|([^\\s]+))`, 'i');
        const match = cmd.match(regex);
        return match ? (match[2] || match[3] || match[4]) : null;
    }

    inputUrl = extractArg(RAW_CMD, '-i');
    finalHeaders = extractArg(RAW_CMD, '-headers') || '';
    const extractedUA = extractArg(RAW_CMD, '-user_agent') || extractArg(RAW_CMD, '-user-agent');
    if (extractedUA) finalUserAgent = extractedUA;

} else if (inputUrl && inputUrl.trim() !== '') {
    console.log("🎯 [MODE 2] Direct M3U8 detect hua. Custom Headers set kar raha hoon...");
    if (refererUrl) {
        finalHeaders = `Referer: ${refererUrl}\r\n`;
    }
} else {
    console.error("❌ [FATAL ERROR]: Aapne na hi FFmpeg command di hai aur na hi M3U8 URL! GitHub Actions inputs check karein.");
    process.exit(1);
}

if (!inputUrl) {
    console.error("❌ [FATAL ERROR]: M3U8 URL extract nahi ho saka. Command ya Link check karein.");
    process.exit(1);
}

// 📅 EXPIRY TIME EXTRACTOR (From URL)
let expireMs = null;
try {
    const urlObj = new URL(inputUrl);
    const expires = urlObj.searchParams.get('expires') || urlObj.searchParams.get('e') || urlObj.searchParams.get('exp');
    if (expires) {
        let extractedExp = expires.match(/\d+/);
        if (extractedExp) {
            expireMs = parseInt(extractedExp[0]);
            if (expireMs.toString().length < 12) expireMs *= 1000; 
        }
    }
} catch (e) {
    console.log("⚠️ URL parsing mein issue hai, expiry read nahi ho saki.");
}

console.log(`🔗 [M3U8 URL]: ${inputUrl.substring(0, 80)}...`);
console.log(`🛡️ [HEADERS]: ${finalHeaders || 'Nahi Diye Gaye'}`);
console.log(`👤 [USER-AGENT]: ${finalUserAgent}`);

if (expireMs) {
    console.log(`📅 [EXPIRY TIME]: ${formatPKT(expireMs)}`);
} else {
    console.log(`📅 [EXPIRY TIME]: (Is URL mein expiry token nahi hai)`);
}
console.log("-".repeat(60));

// ==========================================
// 2️⃣ FFMPEG ENGINE (STREAM TO OK.RU)
// ==========================================
console.log(`\n[🚀 STEP 2] FFmpeg Engine Shuru...`);
console.log(`[📡] Streaming to OK.RU Server ${STREAM_ID}`);

let args = [
    "-re", "-loglevel", "error", 
    "-reconnect", "1", 
    "-reconnect_at_eof", "1", 
    "-reconnect_streamed", "1", 
    "-reconnect_delay_max", "5",
    "-fflags", "+genpts+igndts", 
    "-err_detect", "ignore_err"
];

// Add Headers if exist
if (finalHeaders) {
    const cleanHeaders = finalHeaders.replace(/\\r\\n/g, '\r\n').trim();
    args.push("-headers", cleanHeaders.includes('\r\n') ? cleanHeaders : `${cleanHeaders}\r\n`);
}

// Add User Agent & Input
args.push("-user_agent", finalUserAgent);
args.push("-i", inputUrl);

// Quality Settings (480p, 800k Bitrate)
args.push(
    "-c:v", "libx264", "-preset", "ultrafast", "-b:v", "800k",
    "-vf", "scale=854:480", "-r", "30", "-c:a", "aac", "-b:a", "64k",
    "-f", "flv", RTMP_URL
);

const ffmpeg = spawn('ffmpeg', args);

ffmpeg.stderr.on('data', (err) => {
    console.log(`[⚠️ FFmpeg Log]: ${err.toString().trim()}`);
});

ffmpeg.on('close', (code) => {
    console.log(`\n🛑 FFmpeg Band Hua. (Code: ${code})`);
    console.log(`[🛑] Stream Server ruk gaya hai. Workflow khtam.`);
    process.exit(code);
});

// ==========================================
// 💓 HEARTBEAT (KEEPS GITHUB ALIVE)
// ==========================================
setInterval(() => {
    if (expireMs) {
        let remainingMs = expireMs - Date.now();
        let minsLeft = Math.max(0, Math.round(remainingMs / 60000));
        console.log(`[💓 HEARTBEAT] Stream Server ${STREAM_ID} live hai! Expiry mein approx ${minsLeft} mins baqi...`);
    } else {
        console.log(`[💓 HEARTBEAT] Stream Server ${STREAM_ID} live hai!`);
    }
}, 3 * 60 * 1000);































// =========== option 2 only , k srf m3u8 link and reffer doo =============================


// const { spawn } = require('child_process');
// const { URL } = require('url');

// // ==========================================
// // 🎯 GITHUB INPUTS
// // ==========================================
// const STREAM_ID = process.env.STREAM_ID || '1';
// const inputUrl = process.env.M3U8_URL || '';
// const refererUrl = process.env.REFERER_URL || '';

// // 🔑 OK.RU KEYS YAHAN HARDCODED HAIN
// const MULTI_KEYS = {
//     '1': '14601603391083_14040893622891_puxzrwjniu',
//     '2': '14601696583275_14041072274027_apdzpdb5xi',
//     '3': '14617940008555_14072500914795_ohw67ls7ny',
//     '4': '14601972227691_14041593547371_obdhgewlmq'
// };
// const RTMP_URL = `rtmp://vsu.okcdn.ru/input/${MULTI_KEYS[STREAM_ID]}`;

// function formatPKT(timestampMs = Date.now()) {
//     return new Date(timestampMs).toLocaleString('en-US', {
//         timeZone: 'Asia/Karachi', hour12: true, year: 'numeric', month: 'short',
//         day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
//     }) + " PKT";
// }

// console.log(`\n[🚀 MAIN] Project 11 Boot: ${formatPKT()}`);
// console.log("-".repeat(60));

// if (!inputUrl || !refererUrl) {
//     console.error("❌ [FATAL ERROR]: M3U8 URL ya Referer missig hai! GitHub Actions mein inputs check karein.");
//     process.exit(1);
// }

// // 📅 EXPIRY TIME EXTRACTOR (From URL)
// let expireMs = null;
// try {
//     const urlObj = new URL(inputUrl);
//     const expires = urlObj.searchParams.get('expires') || urlObj.searchParams.get('e') || urlObj.searchParams.get('exp');
//     if (expires) {
//         let extractedExp = expires.match(/\d+/); // Number nikalne ke liye
//         if (extractedExp) {
//             expireMs = parseInt(extractedExp[0]);
//             if (expireMs.toString().length < 12) expireMs *= 1000; 
//         }
//     }
// } catch (e) {
//     console.log("⚠️ URL parsing mein issue hai, expiry read nahi ho saki.");
// }

// console.log(`🔗 [M3U8 URL]: ${inputUrl.substring(0, 80)}...`);
// console.log(`🛡️ [REFERER]: ${refererUrl}`);

// if (expireMs) {
//     console.log(`📅 [EXPIRY TIME]: ${formatPKT(expireMs)}`);
// } else {
//     console.log(`📅 [EXPIRY TIME]: (Is URL mein expiry token nahi hai)`);
// }
// console.log("-".repeat(60));

// // ==========================================
// // 2️⃣ FFMPEG ENGINE (STREAM TO OK.RU)
// // ==========================================
// console.log(`\n[🚀 STEP 2] FFmpeg Engine Shuru...`);
// console.log(`[📡] Streaming to OK.RU Server ${STREAM_ID}`);

// // 🌟 Hardcoded User Agent (Aapki requirement ke mutabiq)
// const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36";
// // Dynamically Referer set kar raha hai
// const HEADERS = `Referer: ${refererUrl}\r\n`;

// let args = [
//     "-re", "-loglevel", "error", 
//     "-reconnect", "1", 
//     "-reconnect_at_eof", "1", 
//     "-reconnect_streamed", "1", 
//     "-reconnect_delay_max", "5",
//     "-fflags", "+genpts+igndts", 
//     "-err_detect", "ignore_err",
//     "-headers", HEADERS,
//     "-user_agent", USER_AGENT,
//     "-i", inputUrl,
    
//     // Quality Settings (480p, 800k Bitrate)
//     "-c:v", "libx264", "-preset", "ultrafast", "-b:v", "800k",
//     "-vf", "scale=854:480", "-r", "30", "-c:a", "aac", "-b:a", "64k",
//     "-f", "flv", RTMP_URL
// ];

// const ffmpeg = spawn('ffmpeg', args);

// ffmpeg.stderr.on('data', (err) => {
//     console.log(`[⚠️ FFmpeg Log]: ${err.toString().trim()}`);
// });

// ffmpeg.on('close', (code) => {
//     console.log(`\n🛑 FFmpeg Band Hua. (Code: ${code})`);
//     console.log(`[🛑] Stream Server ruk gaya hai. Workflow khtam.`);
//     process.exit(code);
// });

// // ==========================================
// // 💓 HEARTBEAT (KEEPS GITHUB ALIVE)
// // ==========================================
// setInterval(() => {
//     if (expireMs) {
//         let remainingMs = expireMs - Date.now();
//         let minsLeft = Math.max(0, Math.round(remainingMs / 60000));
//         console.log(`[💓 HEARTBEAT] Stream Server ${STREAM_ID} par live hai! Expiry mein approx ${minsLeft} minutes baqi hain...`);
//     } else {
//         console.log(`[💓 HEARTBEAT] Stream Server ${STREAM_ID} par live hai!`);
//     }
// }, 3 * 60 * 1000);


































// option 1 , only full command =============== yeh 100% teek hai, bas ooper eek new input dalty hai taakey direct m3u8 link and reffer de skoo afar full ffpmeg command n hu tuu ==========================





// const { spawn } = require('child_process');
// const { URL } = require('url');

// // ==========================================
// // 🎯 GITHUB INPUTS
// // ==========================================
// const RAW_CMD = process.env.FFMPEG_CMD || '';
// const STREAM_ID = process.env.STREAM_ID || '1';

// // 🔑 OK.RU KEYS YAHAN HARDCODED HAIN
// const MULTI_KEYS = {
//     '1': '14601603391083_14040893622891_puxzrwjniu',
//     '2': '14601696583275_14041072274027_apdzpdb5xi',
//     '3': '14617940008555_14072500914795_ohw67ls7ny',
//     '4': '14601972227691_14041593547371_obdhgewlmq'
// };
// const RTMP_URL = `rtmp://vsu.okcdn.ru/input/${MULTI_KEYS[STREAM_ID]}`;

// function formatPKT(timestampMs = Date.now()) {
//     return new Date(timestampMs).toLocaleString('en-US', {
//         timeZone: 'Asia/Karachi', hour12: true, year: 'numeric', month: 'short',
//         day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
//     }) + " PKT";
// }

// console.log(`\n[🚀 MAIN] Project 11 Boot: ${formatPKT()}`);
// console.log("-".repeat(60));

// // ==========================================
// // 🧹 CLEANING AREA (Regex Parser)
// // ==========================================
// console.log("🧹 [CLEANING AREA] Original command ko dho kar parse kar raha hoon...");

// function extractArg(cmd, flag) {
//     const regex = new RegExp(`${flag}\\s+("([^"]+)"|'([^']+)'|([^\\s]+))`, 'i');
//     const match = cmd.match(regex);
//     return match ? (match[2] || match[3] || match[4]) : null;
// }

// const inputUrl = extractArg(RAW_CMD, '-i');
// const headers = extractArg(RAW_CMD, '-headers');
// const userAgent = extractArg(RAW_CMD, '-user_agent') || extractArg(RAW_CMD, '-user-agent');

// if (!inputUrl) {
//     console.error("❌ [FATAL ERROR]: Aapki command mein -i (M3U8 URL) nahi mila! Command check karein.");
//     process.exit(1);
// }

// // 📅 EXPIRY TIME EXTRACTOR (From URL)
// let expireMs = null;
// try {
//     const urlObj = new URL(inputUrl);
//     const expires = urlObj.searchParams.get('expires') || urlObj.searchParams.get('e') || urlObj.searchParams.get('exp');
//     if (expires) {
//         expireMs = parseInt(expires);
//         if (expires.length < 12) expireMs *= 1000; 
//     }
// } catch (e) {
//     console.log("⚠️ URL parsing mein thora issue hai, expiry read nahi ho saki.");
// }

// console.log(`\n🎉 [BINGO] Command Safely Cleaned! Fuzool data phenk diya gaya.`);
// console.log(`🔗 [CLEAN URL]: ${inputUrl.substring(0, 100)}...`);
// console.log(`🛡️ [HEADERS]: ${headers || 'Nahi Diye Gaye'}`);
// console.log(`👤 [USER-AGENT]: ${userAgent || 'Nahi Diya Gaya'}`);

// if (expireMs) {
//     console.log(`📅 [EXPIRY TIME]: ${formatPKT(expireMs)}`);
// } else {
//     console.log(`📅 [EXPIRY TIME]: (Is URL mein expiry token nahi hai)`);
// }
// console.log("-".repeat(60));

// // ==========================================
// // 2️⃣ FFMPEG ENGINE (STREAM TO OK.RU)
// // ==========================================
// console.log(`\n[🚀 STEP 2] FFmpeg Engine Shuru...`);
// console.log(`[📡] Streaming to OK.RU Server ${STREAM_ID}`);
// console.log(`[📺] Output Quality: 854x480, 800k (Better SD Quality)`); // 🌟 Updated Log

// let args = [
//     "-re", "-loglevel", "error", 
//     "-reconnect", "1", 
//     "-reconnect_at_eof", "1", 
//     "-reconnect_streamed", "1", 
//     "-reconnect_delay_max", "5",
//     "-fflags", "+genpts+igndts", 
//     "-err_detect", "ignore_err"
// ];

// if (headers) {
//     const cleanHeaders = headers.replace(/\\r\\n/g, '\r\n').trim();
//     args.push("-headers", cleanHeaders.includes('\r\n') ? cleanHeaders : `${cleanHeaders}\r\n`);
// }

// if (userAgent) {
//     args.push("-user_agent", userAgent);
// }

// args.push("-i", inputUrl);

// // 🌟 NAYA: Quality Thori Behtar Kar Di Gayi Hai (480p, 800k Bitrate, 30fps)
// args.push(
//     "-c:v", "libx264", "-preset", "ultrafast", "-b:v", "800k",
//     "-vf", "scale=854:480", "-r", "30", "-c:a", "aac", "-b:a", "64k",
//     "-f", "flv", RTMP_URL
// );

// const ffmpeg = spawn('ffmpeg', args);

// ffmpeg.stderr.on('data', (err) => {
//     console.log(`[⚠️ FFmpeg Log]: ${err.toString().trim()}`);
// });

// ffmpeg.on('close', (code) => {
//     console.log(`\n🛑 FFmpeg Band Hua. (Code: ${code})`);
//     console.log(`[🛑] Stream Server ruk gaya hai. Workflow khtam.`);
//     process.exit(code);
// });

// // ==========================================
// // 💓 HEARTBEAT (KEEPS GITHUB ALIVE)
// // ==========================================
// setInterval(() => {
//     if (expireMs) {
//         let remainingMs = expireMs - Date.now();
//         let minsLeft = Math.max(0, Math.round(remainingMs / 60000));
//         console.log(`[💓 HEARTBEAT] Stream Server ${STREAM_ID} par live hai! Expiry mein approx ${minsLeft} minutes baqi hain...`);
//     } else {
//         const uptimeMins = Math.floor((Date.now() - Date.now()) / 60000); 
//         console.log(`[💓 HEARTBEAT] Stream Server ${STREAM_ID} par live hai! (URL mein Expiry limit nahi hai)`);
//     }
// }, 3 * 60 * 1000);

















// 1 =============== yeh bilkul teeek hai lekin bas yeh quality ko bohoot low karta hai ========================

// const { spawn } = require('child_process');
// const { URL } = require('url');

// // ==========================================
// // 🎯 GITHUB INPUTS
// // ==========================================
// const RAW_CMD = process.env.FFMPEG_CMD || '';
// const STREAM_ID = process.env.STREAM_ID || '1';

// // 🔑 OK.RU KEYS YAHAN HARDCODED HAIN
// const MULTI_KEYS = {
//     '1': '14601603391083_14040893622891_puxzrwjniu',
//     '2': '14601696583275_14041072274027_apdzpdb5xi',
//     '3': '14617940008555_14072500914795_ohw67ls7ny',
//     '4': '14601972227691_14041593547371_obdhgewlmq'
// };
// const RTMP_URL = `rtmp://vsu.okcdn.ru/input/${MULTI_KEYS[STREAM_ID]}`;

// function formatPKT(timestampMs = Date.now()) {
//     return new Date(timestampMs).toLocaleString('en-US', {
//         timeZone: 'Asia/Karachi', hour12: true, year: 'numeric', month: 'short',
//         day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
//     }) + " PKT";
// }

// console.log(`\n[🚀 MAIN] Project 11 Boot: ${formatPKT()}`);
// console.log("-".repeat(60));

// // ==========================================
// // 🧹 CLEANING AREA (Regex Parser)
// // ==========================================
// console.log("🧹 [CLEANING AREA] Original command ko dho kar parse kar raha hoon...");

// // Function: Raw command mein se sirf kaam ki cheezain nikalna
// function extractArg(cmd, flag) {
//     const regex = new RegExp(`${flag}\\s+("([^"]+)"|'([^']+)'|([^\\s]+))`, 'i');
//     const match = cmd.match(regex);
//     return match ? (match[2] || match[3] || match[4]) : null;
// }

// const inputUrl = extractArg(RAW_CMD, '-i');
// const headers = extractArg(RAW_CMD, '-headers');
// const userAgent = extractArg(RAW_CMD, '-user_agent') || extractArg(RAW_CMD, '-user-agent');

// if (!inputUrl) {
//     console.error("❌ [FATAL ERROR]: Aapki command mein -i (M3U8 URL) nahi mila! Command check karein.");
//     process.exit(1);
// }

// // 📅 EXPIRY TIME EXTRACTOR (From URL)
// let expireMs = null;
// try {
//     const urlObj = new URL(inputUrl);
//     const expires = urlObj.searchParams.get('expires') || urlObj.searchParams.get('e') || urlObj.searchParams.get('exp');
//     if (expires) {
//         expireMs = parseInt(expires);
//         // Agar Unix timestamp (10 digits) hai toh milliseconds mein convert karo
//         if (expires.length < 12) expireMs *= 1000; 
//     }
// } catch (e) {
//     console.log("⚠️ URL parsing mein thora issue hai, expiry read nahi ho saki.");
// }

// console.log(`\n🎉 [BINGO] Command Safely Cleaned! Fuzool data phenk diya gaya.`);
// console.log(`🔗 [CLEAN URL]: ${inputUrl.substring(0, 100)}...`);
// console.log(`🛡️ [HEADERS]: ${headers || 'Nahi Diye Gaye'}`);
// console.log(`👤 [USER-AGENT]: ${userAgent || 'Nahi Diya Gaya'}`);

// if (expireMs) {
//     console.log(`📅 [EXPIRY TIME]: ${formatPKT(expireMs)}`);
// } else {
//     console.log(`📅 [EXPIRY TIME]: (Is URL mein expiry token nahi hai)`);
// }
// console.log("-".repeat(60));

// // ==========================================
// // 2️⃣ FFMPEG ENGINE (STREAM TO OK.RU)
// // ==========================================
// console.log(`\n[🚀 STEP 2] FFmpeg Engine Shuru...`);
// console.log(`[📡] Streaming to OK.RU Server ${STREAM_ID}`);
// console.log(`[📺] Output Quality: 640x360, 300k (Low HD)`);

// // Project 10 wale Anti-Freeze "Dheet" Flags
// let args = [
//     "-re", "-loglevel", "error", 
//     "-reconnect", "1", 
//     "-reconnect_at_eof", "1", 
//     "-reconnect_streamed", "1", 
//     "-reconnect_delay_max", "5",
//     "-fflags", "+genpts+igndts", 
//     "-err_detect", "ignore_err"
// ];

// if (headers) {
//     // Ensuring CRLF is present as FFmpeg is strict about headers
//     const cleanHeaders = headers.replace(/\\r\\n/g, '\r\n').trim();
//     args.push("-headers", cleanHeaders.includes('\r\n') ? cleanHeaders : `${cleanHeaders}\r\n`);
// }

// if (userAgent) {
//     args.push("-user_agent", userAgent);
// }

// args.push("-i", inputUrl);

// // ♻️ REPLACED: Aapka "-c copy output.ts" nikal kar apni Low-Quality logic daal di
// args.push(
//     "-c:v", "libx264", "-preset", "ultrafast", "-b:v", "300k",
//     "-vf", "scale=640:360", "-r", "20", "-c:a", "aac", "-b:a", "32k",
//     "-f", "flv", RTMP_URL
// );

// const ffmpeg = spawn('ffmpeg', args);

// ffmpeg.stderr.on('data', (err) => {
//     console.log(`[⚠️ FFmpeg Log]: ${err.toString().trim()}`);
// });

// ffmpeg.on('close', (code) => {
//     console.log(`\n🛑 FFmpeg Band Hua. (Code: ${code})`);
//     console.log(`[🛑] Stream Server ruk gaya hai. Workflow khtam.`);
//     process.exit(code);
// });

// // ==========================================
// // 💓 HEARTBEAT (KEEPS GITHUB ALIVE)
// // ==========================================
// setInterval(() => {
//     if (expireMs) {
//         let remainingMs = expireMs - Date.now();
//         let minsLeft = Math.max(0, Math.round(remainingMs / 60000));
//         console.log(`[💓 HEARTBEAT] Stream Server ${STREAM_ID} par live hai! Expiry mein approx ${minsLeft} minutes baqi hain...`);
//     } else {
//         const uptimeMins = Math.floor((Date.now() - Date.now()) / 60000); // Simple uptime
//         console.log(`[💓 HEARTBEAT] Stream Server ${STREAM_ID} par live hai! (URL mein Expiry limit nahi hai)`);
//     }
// }, 3 * 60 * 1000); // Har 3 minute baad dhadkega
