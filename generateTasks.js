import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** CONFIGURATION */
const GITHUB_USERNAME = 'BOSSDEV10';
const REPO_NAME = 'Internsheep-Task';
const BASE_URL = `https://${GITHUB_USERNAME}.github.io/${REPO_NAME}`;

const TASK_DIR = path.join(__dirname, 'Tasks');
const OUTPUT_FILE = path.join(__dirname, 'tasks.json');

/**
 * Formats names: "BrewHaven" -> "Brew Haven", "task1" -> "Task"
 */
function formatDisplayName(str) {
    // Adds space before capital letters and removes numbers
    let clean = str.replace(/([A-Z])/g, ' $1').replace(/\d+/g, '').trim();
    return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/**
 * Parses dates or returns a fallback for sorting
 */
function parseFolderDate(folderName) {
    const parts = folderName.split('-');
    if (parts.length === 3) {
        const date = new Date(`${parts[1]} ${parts[0]} ${parts[2]}`);
        return isNaN(date.getTime()) ? null : date;
    }
    return null;
}

/**
 * Scans the Tasks directory
 */
function scanTasks(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;

    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
            const folderDate = parseFolderDate(item);
            let entryPoint = null;
            let displayName = "";

            // 1. Look for index.html inside the folder first
            const filesInFolder = fs.readdirSync(fullPath);
            const indexFile = filesInFolder.find(f => f.toLowerCase() === 'index.html');
            const anyHtml = filesInFolder.find(f => f.endsWith('.html'));

            if (indexFile) {
                entryPoint = indexFile;
                // If it's a named folder like "BrewHaven", use the folder name
                displayName = folderDate ? formatDisplayName(indexFile.replace('.html', '')) : formatDisplayName(item);
            } else if (anyHtml) {
                entryPoint = anyHtml;
                displayName = formatDisplayName(anyHtml.replace('.html', ''));
            }

            if (entryPoint) {
                results.push({
                    displayName: displayName,
                    dateValue: folderDate || stats.birthtime, // Use folder date or creation time
                    link: `${BASE_URL}/Tasks/${item}/${entryPoint}`.replace(/\/+/g, '/').replace('https:/', 'https://')
                });
            }
        }
    }
    return results;
}

try {
    console.log("📂 Scanning tasks and named folders...");

    let rawTasks = scanTasks(TASK_DIR);

    // Sort: Oldest to Newest
    rawTasks.sort((a, b) => a.dateValue - b.dateValue);

    const taskList = rawTasks.map((task, index) => ({
        name: `Task ${index + 1}: ${task.displayName}`,
        link: task.link
    }));

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(taskList, null, 4));

    console.log(`✅ Success! Generated 'tasks.json' with ${taskList.length} tasks.`);
    if (taskList.length > 0) {
        console.log(`First entry: ${taskList[0].name}`);
        console.log(`Last entry: ${taskList[taskList.length - 1].name}`);
    }
} catch (error) {
    console.error("❌ Error:", error.message);
}