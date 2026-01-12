import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** * CONFIGURATION */
const GITHUB_USERNAME = 'BOSSDEV10'; 
const REPO_NAME = 'Internsheep-Task';
const BASE_URL = `https://${GITHUB_USERNAME}.github.io/${REPO_NAME}`;

const TASK_DIR = path.join(__dirname, 'Tasks'); 
const OUTPUT_FILE = path.join(__dirname, 'tasks.json');

/**
 * Removes numbers and capitalizes (e.g., "video0" -> "Video")
 */
function formatDisplayName(str) {
    let clean = str.replace(/\d+/g, ''); 
    return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/**
 * Parses dates for sorting from "DD-Mon-YYYY" format
 */
function parseFolderDate(pathSegments) {
    // We look for the segment immediately following 'Tasks'
    const taskIndex = pathSegments.indexOf('Tasks');
    if (taskIndex === -1 || taskIndex === pathSegments.length - 1) return null;

    const dateStr = pathSegments[taskIndex + 1];
    const parts = dateStr.split('-');
    
    if (parts.length === 3) {
        // Formats to "Mon DD YYYY" which is reliable for the Date constructor
        const date = new Date(`${parts[1]} ${parts[0]} ${parts[2]}`);
        return isNaN(date.getTime()) ? null : date;
    }
    return null;
}

/**
 * Recursive scan to find HTML tasks
 */
function scanTasks(dir, currentRoute = 'Tasks', seenGroups = new Set()) {
    let results = [];
    if (!fs.existsSync(dir)) return results;

    const list = fs.readdirSync(dir);

    for (const item of list) {
        const fullPath = path.join(dir, item);
        const isDirectory = fs.statSync(fullPath).isDirectory();

        if (isDirectory) {
            results = results.concat(scanTasks(fullPath, `${currentRoute}/${item}`, seenGroups));
        } else if (path.extname(item) === '.html') {
            const fileName = item.replace('.html', '');
            const baseName = fileName.replace(/\d+/g, '').toLowerCase(); 
            
            if (!seenGroups.has(baseName)) {
                seenGroups.add(baseName);

                const pathSegments = currentRoute.split('/');
                // Accurately find the date from the folder hierarchy
                const dateValue = parseFolderDate(pathSegments) || fs.statSync(fullPath).birthtime;

                results.push({
                    displayName: formatDisplayName(fileName),
                    dateValue: dateValue,
                    link: `${BASE_URL}/${currentRoute}/${item}`.replace(/\/+/g, '/').replace('https:/', 'https://')
                });
            }
        }
    }
    return results;
}

try {
    console.log("📂 Scanning tasks...");
    
    let rawTasks = scanTasks(TASK_DIR);

    // ASCENDING ORDER SORT (Oldest to Newest)
    // This compares the parsed Date objects directly
    rawTasks.sort((a, b) => a.dateValue - b.dateValue);

    const taskList = rawTasks.map((task, index) => ({
        name: `Task ${index + 1}: ${task.displayName}`,
        link: task.link
    }));

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(taskList, null, 4));
    
    console.log(`✅ Success! Created 'tasks.json' with ${taskList.length} unique tasks.`);
    console.log("First Task Date:", rawTasks[0]?.dateValue.toDateString());
    console.log("Last Task Date:", rawTasks[rawTasks.length - 1]?.dateValue.toDateString());
} catch (error) {
    console.error("❌ Error:", error.message);
}