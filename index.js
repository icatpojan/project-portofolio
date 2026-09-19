require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { Octokit } = require("@octokit/rest");

const INTERVAL = 30 * 60 * 1000; // 30 menit

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.REPO_OWNER || "icatpojan";
const REPO_NAME = process.env.REPO_NAME || "project-portofolio";

const octokit = GITHUB_TOKEN ? new Octokit({ auth: GITHUB_TOKEN }) : null;

const activityDir = path.join(__dirname, "activity");
if (!fs.existsSync(activityDir)) {
    fs.mkdirSync(activityDir, { recursive: true });
}

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

const ISSUE_TEMPLATES = [
    {
        title: "refactor: Optimize memory usage in activity logger",
        body: "### Description\nMemory usage spikes during peak logging intervals.\n\n### Tasks\n- [ ] Analyze heap snapshot\n- [ ] Garbage collection tuning",
        label: "enhancement"
    },
    {
        title: "fix: Handle network timeout exception gracefully",
        body: "### Bug Report\nOccasional network timeout when pushing updates to remote repository.\n\n### Expected Behavior\nRetry request with exponential backoff.",
        label: "bug"
    },
    {
        title: "docs: Update API and workflow automation documentation",
        body: "### Documentation Update\nUpdate README and inline code comments for auto-activity bot.\n\n### Items\n- [ ] Add setup guide for GITHUB_TOKEN",
        label: "documentation"
    }
];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getFormattedTimestamp(now = new Date()) {
    return now.toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).replace(" ", "T");
}

function runGit(cmd) {
    const execOptions = { cwd: __dirname, windowsHide: true, stdio: "pipe" };
    try {
        return execSync(cmd, execOptions).toString().trim();
    } catch (err) {
        throw new Error(`Git Exec Error (${cmd}): ${err.stderr ? err.stderr.toString() : err.message}`);
    }
}

// 1. DIRECT COMMIT
async function handleDirectCommit(timestamp) {
    const topic = getRandomItem(TOPICS);
    const dateStr = timestamp.split("T")[0];
    const fileName = `notes_${dateStr}.md`;
    const filePath = path.join(activityDir, fileName);

    const header = fs.existsSync(filePath) ? "" : `# Activity Journal (${dateStr})\n\n`;
    const note = `${header}## Log [${timestamp}]\n- **Topic**: ${topic}\n- **Status**: Completed direct sync\n- **Memory Heap**: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\n\n`;
    
    fs.appendFileSync(filePath, note);
    const commitMsg = `docs(journal): update notes for ${dateStr} - ${topic.toLowerCase()}`;

    runGit("git add .");
    runGit(`git commit -m "${commitMsg}"`);
    runGit("git push origin main");
    console.log(`[COMMIT] [${timestamp}] Direct commit & push: "${commitMsg}"`);
}

// 2. ISSUE AUTOMATION (Create -> Comment -> Close)
async function handleIssueActivity(timestamp) {
    if (!octokit) {
        console.log(`[ISSUE SKIPPED] GITHUB_TOKEN belum diisi di .env`);
        return handleDirectCommit(timestamp);
    }

    const template = getRandomItem(ISSUE_TEMPLATES);
    const issueTitle = `${template.title} (${timestamp.split("T")[1]})`;

    // Create Issue
    const { data: issue } = await octokit.rest.issues.create({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        title: issueTitle,
        body: template.body,
        labels: [template.label]
    });
    console.log(`[ISSUE CREATED] #${issue.number}: ${issue.title}`);

    // Add Comment to Issue
    await octokit.rest.issues.createComment({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        issue_number: issue.number,
        body: `Automated status check at ${timestamp}: Root cause identified. Resolving now.`
    });
    console.log(`[ISSUE COMMENTED] #${issue.number}`);

    // Close Issue
    await octokit.rest.issues.update({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        issue_number: issue.number,
        state: "closed"
    });
    console.log(`[ISSUE CLOSED] #${issue.number}`);

    // Record activity locally as well
    const dateStr = timestamp.split("T")[0];
    const logFile = path.join(activityDir, `issues_${dateStr}.json`);
    const issueLog = { issueNumber: issue.number, title: issue.title, timestamp, status: "CLOSED" };
    let logs = [];
    if (fs.existsSync(logFile)) {
        try { logs = JSON.parse(fs.readFileSync(logFile, "utf8")); } catch (e) {}
    }
    logs.push(issueLog);
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));

    runGit("git add .");
    runGit(`git commit -m "chore(issues): record activity for issue #${issue.number}"`);
    runGit("git push origin main");
}

// 3. PULL REQUEST AUTOMATION (Create Branch -> Push -> Open PR)
async function handlePullRequestActivity(timestamp) {
    if (!octokit) {
        console.log(`[PR SKIPPED] GITHUB_TOKEN belum diisi di .env`);
        return handleDirectCommit(timestamp);
    }

    const timeId = timestamp.replace(/[:]/g, "-");
    const branchName = `feature/auto-update-${timeId.split("T")[1]}`;
    
    runGit("git checkout -b " + branchName);

    const snippetDir = path.join(activityDir, "snippets");
    if (!fs.existsSync(snippetDir)) fs.mkdirSync(snippetDir, { recursive: true });

    const fileName = `snippet_${timeId}.js`;
    const filePath = path.join(snippetDir, fileName);
    const snippetCode = getRandomItem(SNIPPETS);
    fs.writeFileSync(filePath, `// Helper - ${timestamp}\n${snippetCode}\n`);

    const commitMsg = `feat(helper): add utility snippet for ${timeId.split("T")[1]}`;
    runGit("git add .");
    runGit(`git commit -m "${commitMsg}"`);
    runGit(`git push -u origin ${branchName}`);

    // Back to main
    runGit("git checkout main");

    // Open Pull Request via Octokit
    const { data: pr } = await octokit.rest.pulls.create({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        title: `feat: add utility snippet (${timeId.split("T")[1]})`,
        head: branchName,
        base: "main",
        body: `Automated PR generated at ${timestamp}.\n\nContains helper code snippet.`
    });
    console.log(`[PR CREATED] #${pr.number}: ${pr.title} (Branch: ${branchName})`);
}

// 4. CODE REVIEW & MERGE AUTOMATION
async function handleCodeReviewActivity(timestamp) {
    if (!octokit) {
        console.log(`[REVIEW SKIPPED] GITHUB_TOKEN belum diisi di .env`);
        return handleDirectCommit(timestamp);
    }

    // Find open PRs
    const { data: openPRs } = await octokit.rest.pulls.list({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        state: "open"
    });

    if (openPRs.length === 0) {
        console.log(`[REVIEW] Tidak ada PR yang terbuka. Membuka PR baru terlebih dahulu...`);
        await handlePullRequestActivity(timestamp);
        return;
    }

    const pr = openPRs[0];

    // Submit Code Review
    await octokit.rest.pulls.createReview({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        pull_number: pr.number,
        event: "APPROVE",
        body: `LGTM! Code review completed at ${timestamp}. Everything looks good to merge.`
    });
    console.log(`[CODE REVIEWED] Approved PR #${pr.number}`);

    // Merge PR
    await octokit.rest.pulls.merge({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        pull_number: pr.number,
        merge_method: "squash"
    });
    console.log(`[PR MERGED] Merged PR #${pr.number}`);

    // Pull changes locally
    runGit("git pull origin main");
}

async function autoActivity() {
    try {
        const timestamp = getFormattedTimestamp();

        // 4 Modes: 0=Commit, 1=Issue, 2=Pull Request, 3=Code Review
        const mode = GITHUB_TOKEN ? Math.floor(Math.random() * 4) : 0;

        console.log(`\n========================================`);
        console.log(`[${timestamp}] Running Auto-Activity Mode: ${mode}`);

        if (mode === 0) {
            await handleDirectCommit(timestamp);
        } else if (mode === 1) {
            await handleIssueActivity(timestamp);
        } else if (mode === 2) {
            await handlePullRequestActivity(timestamp);
        } else if (mode === 3) {
            await handleCodeReviewActivity(timestamp);
        }

        console.log(`[${timestamp}] Completed Activity Successfully!`);
        console.log(`========================================\n`);
    } catch (error) {
        console.error("ERROR:", error.message);
        // Clean up git status if stuck on a branch
        try { runGit("git checkout main"); } catch (e) {}
    }
}

async function runInitialAllActivities() {
    console.log(`\n🚀 [INITIAL STARTUP] Executing ALL 4 activities sequentially...`);
    
    // 1. Direct Commit
    try {
        console.log(`\n--- Step 1/4: Direct Commit ---`);
        await handleDirectCommit(getFormattedTimestamp());
    } catch (err) { console.error("Error in Direct Commit:", err.message); }
    
    // 2. Issue Activity
    try {
        console.log(`\n--- Step 2/4: Issue Activity ---`);
        await handleIssueActivity(getFormattedTimestamp());
    } catch (err) { console.error("Error in Issue Activity:", err.message); }

    // 3. Pull Request Activity
    try {
        console.log(`\n--- Step 3/4: Pull Request Activity ---`);
        await handlePullRequestActivity(getFormattedTimestamp());
    } catch (err) { console.error("Error in PR Activity:", err.message); }

    // 4. Code Review & Merge Activity
    try {
        console.log(`\n--- Step 4/4: Code Review & Merge Activity ---`);
        await handleCodeReviewActivity(getFormattedTimestamp());
    } catch (err) { console.error("Error in Code Review Activity:", err.message); }

    console.log(`\n✅ [INITIAL STARTUP COMPLETED] All 4 activities finished!`);
    console.log(`⏰ Scheduled periodic random activity every ${INTERVAL / 1000 / 60} minutes.\n`);
}

async function startBot() {
    await runInitialAllActivities();
    setInterval(autoActivity, INTERVAL);
}

startBot();