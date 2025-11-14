// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: magic;

// widget by bloxyj
// for use in scriptable
// inspired by : jvscholz widget you can download his at https://jvscholz.com/blog/countdown.html

// ===================================================
// USER CONFIGURATION
// ===================================================

// STEP 1: Enter your stat that you want to track (example: "GYM", "Meditation", "Work Project")
const EVENT_NAME = "GYM";


// STEP 2: Enter your obsidian stat trak path 
// Important: make sure the files in your path are downloaded and available locally
// You will need to set up a bookmark in Scriptable for your Obsidian vault first
// Exemple for Obsidian vault bookmark name: "obsidian"
// Example for file inside your Obsidian vault: "MyStats/GYM_Streak.md"

const fm = FileManager.iCloud();
const vaultPath = fm.bookmarkedPath("obsidian");
const OB_PATH = fm.joinPath(vaultPath, "MyStats/GYM_Streak.md");

await fm.downloadFileFromiCloud(OB_PATH);
const content = fm.readString(OB_PATH);

// STEP 3: Add your background image URL
// Replace with your own image URL or leave blank for no image
// To use a transparent background, use the transparent script, then upload it to the internet somewhere and link it here
const BG_IMAGE_URL = "imgur.com/meow";

// STEP 4: Customize the appearance (optional)
// Background overlay color and opacity
const BG_COLOR = "#1C1C1C";       // Overlay color in hex format
const BG_OVERLAY_OPACITY = 0.5;   // Overlay opacity (0-1)

// Color settings for dots
const COLOR_FILLED = new Color("#ffffff");         // Color for completed days
const COLOR_UNFILLED = new Color("#a78bfa");       // Color for remaining days

// STEP 5: Layout settings
// These are optimized for my iPhone XS Max. You may need to adjust for different devices.
// Increase values for larger screens, decrease for smaller screens.
const PADDING = 8;           // Space around the edges of the widget
const CIRCLE_SIZE = 6;       // Size of the progress dots
const CIRCLE_SPACING = 4;    // Space between dots
const TEXT_SPACING = 8;      // Space between dot grid and text
const DOT_SHIFT_LEFT = 2;
const YEAR_OFFSET = DOT_SHIFT_LEFT - 2;
const DAYS_LEFT_OFFSET = 0;


// ===================================================
// ADVANCED CONFIGURATION
// ===================================================

const NOW = new Date();
const MS_PER_DAY = 86400000;

// Adjust start date to reduce or increase dots shown
const YEAR_START = new Date(NOW.getFullYear(), NOW.getMonth() - 9, NOW.getDate() - 17);
const YEAR_END = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());

const dateKey = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};


const completionMap = (() => {
    const map = {};
    const lineRegex = /^- \[( |x)\]\s*(\d{4}-\d{2}-\d{2})/i;
    for (const line of content.split(/\r?\n/)) {
        const match = line.match(lineRegex);
        if (!match) continue;
        const checked = match[1].toLowerCase() === "x";
        const trackedDate = match[2];
        map[trackedDate] = checked;
    }
    return map;
})();

const DAYS_TOTAL = Math.round((YEAR_END - YEAR_START) / MS_PER_DAY) + 1;

const DATE_RANGE = Array.from({ length: DAYS_TOTAL }, (_, idx) => {
    const current = new Date(YEAR_START.getTime() + idx * MS_PER_DAY);
    return { date: current, key: dateKey(current) };
});

const DAYS_COMPLETED = DATE_RANGE.reduce((count, entry) => {
    return completionMap[entry.key] ? count + 1 : count;
}, 0);

const widget = new ListWidget();

let bgImage = null;
try {
    const req = new Request(BG_IMAGE_URL);
    bgImage = await req.loadImage();
} catch (e) {
    console.log("Couldn't load background image");
}

if (bgImage) {
    widget.backgroundImage = bgImage;
}

const overlay = new LinearGradient();
overlay.locations = [0, 1];
overlay.colors = [
    new Color(BG_COLOR, BG_OVERLAY_OPACITY),
    new Color(BG_COLOR, BG_OVERLAY_OPACITY)
];
widget.backgroundGradient = overlay;

const WIDGET_WIDTH = 320;
const AVAILABLE_WIDTH = WIDGET_WIDTH - (2 * PADDING);
const TOTAL_CIRCLE_WIDTH = CIRCLE_SIZE + CIRCLE_SPACING;
const COLUMNS = Math.floor(AVAILABLE_WIDTH / TOTAL_CIRCLE_WIDTH);
const ROWS = Math.ceil(DAYS_TOTAL / COLUMNS);

const MENLO_REGULAR = new Font("Menlo", 12);
const MENLO_BOLD = new Font("Menlo-Bold", 12);

widget.setPadding(12, PADDING, 12, PADDING);

const gridContainer = widget.addStack();
gridContainer.layoutVertically();

const gridStack = gridContainer.addStack();
gridStack.layoutVertically();
gridStack.spacing = CIRCLE_SPACING;

for (let row = 0; row < ROWS; row++) {
    const rowStack = gridStack.addStack();
    rowStack.layoutHorizontally();
    rowStack.addSpacer(DOT_SHIFT_LEFT);
    
    for (let col = 0; col < COLUMNS; col++) {
        const day = row * COLUMNS + col + 1;
        if (day > DAYS_TOTAL) continue;
        const entry = DATE_RANGE[day - 1];
        if (!entry) continue;
        
        const circle = rowStack.addText("●");
        circle.font = Font.systemFont(CIRCLE_SIZE);
        circle.textColor = completionMap[entry.key] ? COLOR_UNFILLED : COLOR_FILLED;
        
        if (col < COLUMNS - 1) rowStack.addSpacer(CIRCLE_SPACING);
    }
}

widget.addSpacer(TEXT_SPACING);

const footer = widget.addStack();
footer.layoutHorizontally();

const eventStack = footer.addStack();
eventStack.addSpacer(YEAR_OFFSET);
const eventText = eventStack.addText(EVENT_NAME);
eventText.font = MENLO_BOLD;
eventText.textColor = COLOR_FILLED;

const daysText = `${DAYS_COMPLETED} days done`;
const textWidth = daysText.length * 7.5;
const availableSpace = WIDGET_WIDTH - (PADDING * 2) - YEAR_OFFSET - (eventText.text.length * 7.5);
const spacerLength = availableSpace - textWidth + DAYS_LEFT_OFFSET;

footer.addSpacer(spacerLength);

const daysTextStack = footer.addStack();
const daysLeft = daysTextStack.addText(daysText);
daysLeft.font = MENLO_REGULAR;
daysLeft.textColor = COLOR_UNFILLED;

if (config.runsInWidget) {
    Script.setWidget(widget);
} else {
    widget.presentMedium();
}
Script.complete();