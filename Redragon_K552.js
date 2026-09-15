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

/* global
lightingMode:readonly
*/

export function ControllableParameters() {
    return [
        {
            property: "lightingMode",
            group: "lighting",
            label: "Lighting Mode",
            type: "combobox",
            values: ["Canvas", "Off"],
            default: "Canvas"
        }
    ];
}

// The EVision K552 firmware exposes a 126-slot RGB buffer. These are the
// 88 slots that correspond to the physical ISO TKL keys; the remaining
// slots are unused positions from the shared EVision keyboard matrix.
const vLedNames = [
    "Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "Print Screen", "Scroll Lock", "Pause",
    "`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "Backspace", "Insert", "Home", "Page Up",
    "Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "´", "+", "Delete", "End", "Page Down",
    "Caps Lock", "A", "S", "D", "F", "G", "H", "J", "K", "L", "Ñ", "{", "}", "Enter",
    "Left Shift", "<", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "-", "Right Shift", "Up",
    "Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl", "Left", "Down", "Right"
];

// 0-based EVision LED slots, in the same order as vLedNames above.
const vLeds = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16,
    21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 35, 36, 37,
    42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58,
    63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76,
    84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 97, 99,
    105, 106, 107, 108, 109, 110, 111, 113, 119, 120, 121
];

// Physical ISO TKL layout. The gaps leave room for the function-key and
// navigation-key spacing while keeping the SignalRGB canvas aligned.
const vLedPositions = [
    [0, 0], [2, 0], [3, 0], [4, 0], [5, 0], [7, 0], [8, 0], [9, 0], [10, 0], [12, 0], [13, 0], [14, 0], [15, 0], [17, 0], [18, 0], [19, 0],
    [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1], [15, 1], [16, 1], [17, 1],
    [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [15, 2], [16, 2], [17, 2],
    [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3],
    [0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [13, 4], [17, 4],
    [0, 5], [1, 5], [2, 5], [6, 5], [11, 5], [12, 5], [13, 5], [14, 5], [16, 5], [17, 5], [18, 5]
];

let lastSentFrame = null;

export function Initialize() {
    device.setName(Name());
    device.setSize(Size());
    device.setControllableLeds(vLedNames, vLedPositions);
    setSoftwareMode();
}

export function Render() {
    sendColors(lightingMode === "Off" ? "#000000" : null);
}

export function Shutdown(SystemSuspending) {
    sendColors("#000000");
}

function setSoftwareMode() {
    // EVision custom mode (0x14), brightness 4, normal speed 3.
    sendMode([0x14, 0x04, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00]);
}

function sendMode(modeData) {
    let packet = [0x04, 0x00, 0x00, 0x06, modeData.length, 0x00, 0x00, 0x00].concat(modeData);
    while (packet.length < 64) {
        packet.push(0);
    }
    applyChecksum(packet);
    device.write(packet, 64);
    device.pause(5);
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
}

function sendColors(overrideColor) {
    // 126 EVision LED slots × RGB. Only the six occupied keyboard rows are
    // sent; unused matrix gaps are not transmitted.
    const RGBData = new Array(126 * 3).fill(0);
    const fixedColor = overrideColor ? hexToRgb(overrideColor) : null;

    for (let i = 0; i < vLeds.length; i++) {
        const x = vLedPositions[i][0];
        const y = vLedPositions[i][1];
        const color = fixedColor || device.color(x, y);

        if (color) {
            const ledIndex = vLeds[i] * 3;
            RGBData[ledIndex] = color[0];
            RGBData[ledIndex + 1] = color[1];
            RGBData[ledIndex + 2] = color[2];
        }
    }

    // Solid colors and unchanged effect frames do not need to be sent again.
    // Repeating the six HID packets makes the K552 visibly redraw partial
    // frames while the controller is receiving them.
    if (lastSentFrame) {
        let sameFrame = true;
        for (let i = 0; i < RGBData.length; i++) {
            if (RGBData[i] !== lastSentFrame[i]) {
                sameFrame = false;
                break;
            }
        }
        if (sameFrame) {
            return;
        }
    }

    lastSentFrame = RGBData;
    writeRGBPackages(RGBData);
}

function applyChecksum(packet) {
    let checksum = 0;
    for (let i = 3; i < packet.length; i++) {
        checksum += packet[i];
    }
    packet[1] = checksum & 0xFF;
    packet[2] = (checksum >>> 8) & 0xFF;
}

function writeRGBPackages(RGBData) {
    // Each range is one occupied keyboard row. The largest range is 17 RGB
    // slots (51 bytes), so every range fits in one EVision HID packet.
    const ranges = [
        [0, 17 * 3],
        [21 * 3, 17 * 3],
        [42 * 3, 17 * 3],
        [63 * 3, 14 * 3],
        [84 * 3, 16 * 3],
        [105 * 3, 17 * 3]
    ];

    for (let index = 0; index < ranges.length; index++) {
        const offset = ranges[index][0];
        const data = RGBData.slice(offset, offset + ranges[index][1]);
        let packet = [0x04, 0x00, 0x00, 0x11, data.length, offset & 0xFF, offset >>> 8, 0x00].concat(data);

        while (packet.length < 64) {
            packet.push(0);
        }

        applyChecksum(packet);
        device.write(packet, 64);
        device.pause(1);
    }
}
