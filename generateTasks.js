import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** * CONFIGURATION
 * 1. Ensure GITHUB_USERNAME and REPO_NAME are exactly as they appear in your URL.
 * 2. If you are using a custom domain, replace the BASE_URL entirely.
 */
const GITHUB_USERNAME = 'YOUR_USERNAME'; 
const REPO_NAME = 'YOUR_REPO_NAME';
const BASE_URL = `https://${GITHUB_USERNAME}.github.io/${REPO_NAME}`.replace(/\/$/, ""); // Remove trailing slash if exists

const TASK_DIR = path.join(__dirname, 'public', 'Task');
const OUTPUT_FILE = path.join(__dirname, 'src', 'utils', 'taskList.js');

function getTaskDate(folderName, filePath) {
    const parts = folderName.split('-');
    const parsedDate = new Date(`${parts[1]} ${parts[0]} ${parts[2]}`);
    return !isNaN(parsedDate.getTime()) ? parsedDate : fs.statSync(filePath).birthtime;
}

function getTitleFromHTML(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const match = content.match(/<title>(.*?)<\/title>/i);
        return match ? match[1].trim() : null;
    } catch { return null; }
}

function formatDisplayName(str) {
    let clean = str.replace(/\d+$/, ''); 
    return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function scanTasks(dir, baseRoute = '/Task', seenGroups = new Set()) {
    let results = [];
    if (!fs.existsSync(dir)) return results;

    const list = fs.readdirSync(dir);

    for (const item of list) {
        const fullPath = path.join(dir, item);
        const isDirectory = fs.statSync(fullPath).isDirectory();

        if (isDirectory) {
            results = results.concat(scanTasks(fullPath, `${baseRoute}/${item}`, seenGroups));
        } else if (path.extname(item) === '.html') {
            const fileName = item.replace('.html', '');
            const groupKey = fileName.replace(/\d+$/, '').toLowerCase();
            
            if (!seenGroups.has(groupKey) || !/\d$/.test(fileName)) {
                seenGroups.add(groupKey);
                const pathSegments = baseRoute.split('/');
                const folderName = pathSegments[pathSegments.length - 1];
                const displayName = getTitleFromHTML(fullPath) || formatDisplayName(fileName);

                results.push({
                    displayName: displayName,
                    dateValue: getTaskDate(folderName, fullPath),
                    // Ensure the route starts with a single slash
                    link: `${BASE_URL}/${baseRoute.replace(/^\//, "")}/${item}`.replace(/\/+/g, '/')
                        .replace('https:/', 'https://') // Fix double-slash cleanup for protocol
                });
            }
        }
    }
    return results;
}

try {
    let tasks = scanTasks(TASK_DIR);
    tasks.sort((a, b) => a.dateValue - b.dateValue);

    const finalTaskList = tasks.map((task, index) => ({
        name: `Task ${index + 1}: ${task.displayName}`,
        link: task.link
    }));

    const outDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const fileContent = `export const taskList = ${JSON.stringify(finalTaskList, null, 4)};\n\nexport default taskList;`;
    fs.writeFileSync(OUTPUT_FILE, fileContent);
    console.log(`✅ Success! Links generated for ${BASE_URL}`);
} catch (error) {
    console.error("❌ Error:", error.message);
}