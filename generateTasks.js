import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** * CONFIGURATION
 * Set your GitHub details here.
 */
const GITHUB_USERNAME = 'BOSSDEV10'; 
const REPO_NAME = 'Internsheep-Task';
const BASE_URL = `https://${GITHUB_USERNAME}.github.io/${REPO_NAME}`;

// Use 'public/Tasks' as source but links will remove 'public'
const TASK_DIR = path.join(__dirname, 'Tasks'); 
const OUTPUT_FILE = path.join(__dirname, 'tasks.json'); // Generates one single JSON file

/**
 * Removes numbers and capitalizes (e.g., "video0" -> "Video")
 */
function formatDisplayName(str) {
    let clean = str.replace(/\d+/g, ''); // Remove all numbers
    return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/**
 * Parses dates for sorting
 */
function getTaskDate(folderName, filePath) {
    const parts = folderName.split('-');
    const parsedDate = new Date(`${parts[1]} ${parts[0]} ${parts[2]}`);
    return !isNaN(parsedDate.getTime()) ? parsedDate : fs.statSync(filePath).birthtime;
}

/**
 * Recursive scan
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
            const baseName = fileName.replace(/\d+/g, '').toLowerCase(); // Grouping key
            
            // Only add the first instance of a similar task (e.g., only video0, ignore video1-4)
            if (!seenGroups.has(baseName)) {
                seenGroups.add(baseName);

                const pathSegments = currentRoute.split('/');
                const folderName = pathSegments[pathSegments.length - 1];

                results.push({
                    displayName: formatDisplayName(fileName),
                    dateValue: getTaskDate(folderName, fullPath),
                    // Generates clean link: https://user.github.io/repo/Tasks/date/file.html
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

    // Sort Oldest to Newest
    rawTasks.sort((a, b) => a.dateValue - b.dateValue);

    const taskList = rawTasks.map((task, index) => ({
        name: `Task ${index + 1}: ${task.displayName}`,
        link: task.link
    }));

    // Save as a single .json file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(taskList, null, 4));
    
    console.log(`✅ Success! Created 'tasks.json' with ${taskList.length} unique tasks.`);
} catch (error) {
    console.error("❌ Error:", error.message);
}