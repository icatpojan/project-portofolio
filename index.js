const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const INTERVAL = 30 * 60 * 1000; // 30 menit
const activityDir = path.join(__dirname, "activity");

if (!fs.existsSync(activityDir)) {
    fs.mkdirSync(activityDir, { recursive: true });
}

// Pools data untuk konten & commit message yang bervariasi
const TOPICS = [
    "Node.js Event Loop Optimization",
    "Git Workflow Best Practices",
    "Clean Code & Refactoring Patterns",
    "Async/Await Error Handling",
    "Database Indexing Strategies",
    "REST API Design Guidelines",
    "State Management in Frontend Frameworks",
    "Docker Container Optimization",
    "Security Best Practices in Web Apps",
    "CI/CD Automation Pipelines"
];

const SNIPPETS = [
    `// Helper: Chunk array into smaller sizes\nconst chunk = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, (i + 1) * size));`,
    `// Helper: Debounce execution\nconst debounce = (fn, ms) => { let timeout; return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => fn(...args), ms); }; };`,
    `// Helper: Random string generator\nconst randomStr = (len = 8) => Math.random().toString(36).substring(2, 2 + len);`,
    `// Helper: Formatting currency IDR\nconst formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);`,
    `// Helper: Sleep utility\nconst sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));`
];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateContent(now) {
    const timestamp = now.toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).replace(" ", "T");
    const dateStr = timestamp.split("T")[0];
    const mode = Math.floor(Math.random() * 3); // 0: Markdown Note, 1: JSON Metrics, 2: Code Snippet

    let fileName, filePath, commitMsg;

    if (mode === 0) {
        // Mode 0: Catatan / Journal Markdown
        const topic = getRandomItem(TOPICS);
        fileName = `notes_${dateStr}.md`;
        filePath = path.join(activityDir, fileName);

        const header = fs.existsSync(filePath) ? "" : `# Activity Journal (${dateStr})\n\n`;
        const note = `${header}## Log [${timestamp}]\n- **Topic**: ${topic}\n- **Status**: Completed periodic sync\n- **Memory Heap**: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\n\n`;
        
        fs.appendFileSync(filePath, note);
        commitMsg = `docs(journal): update notes for ${dateStr} - ${topic.toLowerCase()}`;
    } else if (mode === 1) {
        // Mode 1: JSON Performance Metrics
        fileName = `metrics_${dateStr}.json`;
        filePath = path.join(activityDir, fileName);

        const metricsData = {
            timestamp,
            uptimeSeconds: Math.floor(process.uptime()),
            memoryUsedMB: parseFloat((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)),
            activeWorkers: Math.floor(Math.random() * 5) + 1,
            completedTasks: Math.floor(Math.random() * 50) + 10,
            status: "HEALTHY"
        };

        fs.writeFileSync(filePath, JSON.stringify(metricsData, null, 2));
        commitMsg = `feat(metrics): snapshot system stats at ${timestamp.split("T")[1]}`;
    } else {
        // Mode 2: Utility Code Snippet
        const snippetDir = path.join(activityDir, "snippets");
        if (!fs.existsSync(snippetDir)) fs.mkdirSync(snippetDir, { recursive: true });

        const timeId = timestamp.replace(/[:]/g, "-");
        fileName = `snippet_${timeId}.js`;
        filePath = path.join(snippetDir, fileName);

        const snippetCode = getRandomItem(SNIPPETS);
        const content = `// Auto-generated helper snippet - ${timestamp}\n${snippetCode}\n`;

        fs.writeFileSync(filePath, content);
        commitMsg = `refactor(snippets): add helper utility function (${timeId.split("T")[1]})`;
    }

    return { fileName, commitMsg, timestamp };
}

function autoCommit() {
    try {
        const now = new Date();
        const { fileName, commitMsg, timestamp } = generateContent(now);

        console.log(`[${timestamp}] Updated/Created: ${fileName}`);

        const execOptions = { cwd: __dirname, windowsHide: true };

        execSync("git add .", execOptions);
        execSync(`git commit -m "${commitMsg}"`, execOptions);
        execSync("git push origin main", execOptions);

        console.log(`[${timestamp}] Push berhasil: "${commitMsg}"\n`);
    } catch (error) {
        console.error("ERROR:", error.message);
    }
}

// Jalankan langsung lalu ulang setiap interval
autoCommit();
setInterval(autoCommit, INTERVAL);
