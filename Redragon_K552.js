export function Name() { return "Redragon K552 RGB Custom"; }
export function VendorId() { return 0x320F; }
export function ProductId() { return 0x5000; }
export function Publisher() { return "Mostakim"; }
export function Size() { return [20, 6]; }
export function DeviceType() { return "keyboard"; }
export function FPS() { return 20; }
export function Validate(endpoint) {
    return endpoint.interface === 1 &&
        endpoint.usage === 0x0092 &&
        endpoint.usage_page === 0xFF1C &&
        endpoint.collection === 0x0004;
}
export function ImageUrl() { return ""; }

// Set true only when inspecting raw hardware slots.
const DEBUG_MAPPING = false;
const DEBUG_SLOT_COUNT = 126;
const DEBUG_HOLD_FRAMES = 20; // 1 second per slot at 20 FPS.
let currentDebugSlot = 0;
let debugFrames = 0;
let lastReportedDebugSlot = -1;

export function ControllableParameters() {
    return [
        {
            property: "DebugSlot",
            label: "Diagnostic slot",
            type: "number",
            min: 0,
            max: DEBUG_SLOT_COUNT - 1,
            step: 1,
            default: 0
        },
        {
            property: "DebugAuto",
            label: "Automatic slot scan",
            type: "boolean",
            default: true
        },
        {
            property: "DebugColor",
            label: "Diagnostic color",
            type: "color",
            default: "#FF0000"
        }
    ];
}



const vLedPositions = [
    [0, 0], [2, 0], [3, 0], [4, 0], [5, 0], [7, 0], [8, 0], [9, 0], [10, 0], [12, 0], [13, 0], [14, 0], [15, 0], [17, 0], [18, 0], [19, 0],
    [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1], [17, 1], [18, 1], [19, 1],
    [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [17, 2], [18, 2], [19, 2],
    [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [14, 3],
    [0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [13, 4], [18, 4],
    [0, 5], [1, 5], [2, 5], [6, 5], [11, 5], [12, 5], [13, 5], [14, 5], [17, 5], [18, 5], [19, 5]
];


const legacyVLedMap = {
    "Esc": 0, 
    "F1": 8, 
    "F2": 16, 
    "F3": 24, 
    "F4": 32, 
    "F5": 40, 
    "F6": 48, 
    "F7": 56, 
    "F8": 64, 
    "F9": 72, 
    "F10": 80, 
    "F11": 88, 
    "F12": 96,
    "ImpPnt": 104,
    "ScrLck": 112,
    "Pause": 120,
    "|": 1,
    "1": 9,
    "2": 17,
    "3": 25,
    "4": 33,
    "5": 41,
    "6": 49,
    "7": 57,
    "8": 65,
    "9": 73,
    "0": 81,
    "'": 89,
    "¿": 97,
    "Backspace": 105,
    "Insert": 113,
    "Inicio": 121,
    "RePag": 115,
    "Tab": 2,
    "Q": 10,
    "W": 18,
    "E": 26,
    "R": 34,
    "T": 42,
    "Y": 50,
    "U": 58,
    "I": 66,
    "O": 74,
    "P": 82,
    "´": 90,
    "+": 98,
    "Delete": 114,
    "End": 122,
    "Page Down": 123,
    "Bloq Mayús": 3,
    "A": 11,
    "S": 19,
    "D": 27,
    "F": 35,
    "G": 43,
    "H": 51,
    "J": 59,
    "K": 67,
    "L": 75,
    "Ñ": 83,
    "{": 91,
    "}": 99,
    "Enter": 107,
    "Shift izq.": 4,
    "<": 12,
    "Z": 20,
    "X": 28,
    "C": 36,
    "V": 44,
    "B": 52,
    "N": 60,
    "M": 68,
    ",": 76,
    ".": 84,
    "-": 92,
    "Shift der.": 108,
    "Up Arrow": 116,
    "Ctrl izq.": 5,
    "Win": 13,
    "Alt izq.": 21,
    "Space": 45,
    "Alt der.": 77,
    "Fn": 85,
    "Menu": 93,
    "Ctrl der.": 101,
    "Left Arrow": 109,
    "Down Arrow": 117,
    "Right Arrow": 125,
}

/*
const unusedVLedNames = [
    "Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "ImpPnt", "ScrLck", "Pause",
    "|", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "'", "Â¿", "Backspace", "Insert", "Inicio", "RePag",
    "Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "Â´", "+", "Delete", "End", "Page Down",
    "Bloq MayÃºs", "A", "S", "D", "F", "G", "H", "J", "K", "L", "Ã‘", "{", "}", "Enter",
    "Shift izq.", "<", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "-", "Shift der.", "Up Arrow",
    "Ctrl izq.", "Win", "Alt izq.", "Space", "Alt der.", "Fn", "Menu", "Ctrl der.", "Left Arrow", "Down Arrow", "Right Arrow"
];
*/

// The map is the single source of truth for names and physical slots.
// Keep this order explicit. Object.keys() moves integer-like names such as
// "1", "2", etc. before the other keys, which breaks the layout/name pairing.
const legacyVLedNamesSource = [
    "Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "ImpPnt", "ScrLck", "Pause",
    "|", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "'", "¿", "Backspace", "Insert", "Inicio", "RePag",
    "Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "¨", "+", "Delete", "End", "Page Down",
    "Bloq Mayus", "A", "S", "D", "F", "G", "H", "J", "K", "L", "ñ", "{", "}", "Enter",
    "Shift izq.", "<", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "-", "Shift der.", "Up Arrow",
    "Ctrl izq.", "Win", "Alt izq.", "Space", "Alt der.", "Fn", "Menu", "Ctrl der.", "Left Arrow", "Down Arrow", "Right Arrow"
];

// Display names are independent from the hardware slots and use stable Unicode.
const vLedNames = [
    "Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "ImpPnt", "ScrLck", "Pause",
    "|", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "'", "\u00BF", "Backspace", "Insert", "Inicio", "RePag",
    "Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "\u00B4", "+", "Delete", "End", "Page Down",
    "Bloq Mayus", "A", "S", "D", "F", "G", "H", "J", "K", "L", "\u00D1", "{", "}", "Enter",
    "Shift izq.", "<", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "-", "Shift der.", "Up Arrow",
    "Ctrl izq.", "Win", "Alt izq.", "Space", "Alt der.", "Fn", "Menu", "Ctrl der.", "Left Arrow", "Down Arrow", "Right Arrow"
];

// Hardware slots, in exactly the same order as vLedPositions.
const vLedSlots = [
    0, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112, 120,
    1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 115,
    2, 10, 18, 26, 34, 42, 50, 58, 66, 74, 82, 90, 98, 114, 122, 123,
    3, 11, 19, 27, 35, 43, 51, 59, 67, 75, 83, 91, 99, 107,
    4, 12, 20, 28, 36, 44, 52, 60, 68, 76, 84, 92, 108, 116,
    5, 13, 21, 45, 77, 85, 93, 101, 109, 117, 125
];

if (false) {
// These three labels were previously affected by the file's legacy encoding.
// Keep the labels readable and resolve their existing map keys explicitly.
vLedNames[43] = "\u00B4";       // ´
vLedNames[48] = "Bloq Mayus";
vLedNames[58] = "\u00D1";       // Ñ
const legacyVLedNames = {
    43: "\u00C2\u00B4",
    48: "Bloq May\u00C3\u00BAs",
    58: "\u00C3\u2018"
};
}
const vLeds = vLedSlots;

export function Initialize() {
    device.setName(Name());
    device.setSize(Size());
    device.setControllableLeds(vLedNames, vLedPositions);
    device.write([0x04, 0x8C, 0x00, 0x0B, 0x30, 0x50, 0x01], 64);
}

export function Render() {
    if (DEBUG_MAPPING) {
        renderDebugSlot();
        return;
    }

    sendColors();
}

export function Shutdown(SystemSuspending) {
    if (DEBUG_MAPPING) {
        writeRGBPackages(new Array(DEBUG_SLOT_COUNT * 3).fill(0));
        return;
    }

    sendColors(true);
}

function renderDebugSlot() {
    const RGBData = new Array(DEBUG_SLOT_COUNT * 3).fill(0);
    const autoScan = typeof DebugAuto === "undefined" ? true : DebugAuto;
    const selectedSlot = typeof DebugSlot === "undefined" ? currentDebugSlot : DebugSlot;

    if (!autoScan) {
        currentDebugSlot = Math.max(0, Math.min(DEBUG_SLOT_COUNT - 1, Number(selectedSlot)));
    }

    const ledIndex = currentDebugSlot * 3;
    const color = parseColor(typeof DebugColor === "undefined" ? "#FF0000" : DebugColor);

    // RGBData is GRB for this keyboard.
    RGBData[ledIndex] = color[1];
    RGBData[ledIndex + 1] = color[0];
    RGBData[ledIndex + 2] = color[2];

    if (lastReportedDebugSlot !== currentDebugSlot) {
        device.setName(Name() + " DEBUG slot " + currentDebugSlot);
        lastReportedDebugSlot = currentDebugSlot;
    }
    writeRGBPackages(RGBData);

    if (autoScan) {
        debugFrames++;
        if (debugFrames >= DEBUG_HOLD_FRAMES) {
            debugFrames = 0;
            currentDebugSlot = (currentDebugSlot + 1) % DEBUG_SLOT_COUNT;
        }
    }
}

export function onDebugSlotChanged() {
    currentDebugSlot = Math.max(0, Math.min(DEBUG_SLOT_COUNT - 1, Number(DebugSlot)));
    debugFrames = 0;
    lastReportedDebugSlot = -1;
}

function parseColor(value) {
    const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(value);
    return match
        ? [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)]
        : [255, 0, 0];
}

function sendColors(turnOff) {
    const RGBData = new Array(126 * 3).fill(0);

    for (let i = 0; i < vLeds.length; i++) {
        const x = vLedPositions[i][0];
        const y = vLedPositions[i][1];
        const color = turnOff ? [0, 0, 0] : device.color(x, y);

        if (color) {
            const ledIndex = vLeds[i] * 3;
            // The controller expects GRB, while SignalRGB provides RGB.
            RGBData[ledIndex] = color[1];
            RGBData[ledIndex + 1] = color[0];
            RGBData[ledIndex + 2] = color[2];
        }
    }

    writeRGBPackages(RGBData);
}

function checksum(data, index, bytesToSend) {
    let checksum = 0;
    for (let i = 0; i < data.length; i++) {
        checksum += data[i];
    }
    checksum += index >= 5
        ? ((index - 5) * bytesToSend) + 99
        : (index * bytesToSend) + 74;
    return [checksum & 0xFF, (checksum >>> 8) & 0xFF];
}

function writeRGBPackages(RGBData) {
    const bytesToSend = 24;
    const totalPackets = Math.ceil(RGBData.length / bytesToSend);

    for (let index = 0; index < totalPackets; index++) {
        const offset = index * bytesToSend;
        const data = RGBData.slice(offset, offset + bytesToSend);
        while (data.length < bytesToSend) {
            data.push(0);
        }

        const sum = checksum(data, index, bytesToSend);
        let packet = [0x04, sum[0], sum[1], 0x12,
            bytesToSend, offset & 0xFF, (offset >>> 8) & 0xFF, 0x00].concat(data);

        while (packet.length < 64) {
            packet.push(0);
        }

        device.write(packet, 64);
        device.pause(2);
    }
}
