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

// Physical ISO TKL layout.
const vLedNames = [
    "Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "Print Screen", "Scroll Lock", "Pause",
    "`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "Backspace", "Insert", "Home", "Page Up",
    "Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "´", "+", "Delete", "End", "Page Down",
    "Caps Lock", "A", "S", "D", "F", "G", "H", "J", "K", "L", "Ñ", "{", "}", "Enter",
    "Left Shift", "<", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "-", "Right Shift", "Up",
    "Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl", "Left", "Down", "Right"
];

const vLedPositions = [
    [0, 0], [2, 0], [3, 0], [4, 0], [5, 0], [7, 0], [8, 0], [9, 0], [10, 0], [12, 0], [13, 0], [14, 0], [15, 0], [17, 0], [18, 0], [19, 0],
    [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1], [15, 1], [16, 1], [17, 1],
    [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [15, 2], [16, 2], [17, 2],
    [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3],
    [0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [13, 4], [17, 4],
    [0, 5], [1, 5], [2, 5], [6, 5], [11, 5], [12, 5], [13, 5], [14, 5], [16, 5], [17, 5], [18, 5]
];

// Explicit K552RGB-1 map. The controller stores RGB slots column-major with
// six rows; the canvas positions are visual and must not be used as columns.
const vLeds = [
    0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84, 90,
    1, 7, 13, 19, 25, 31, 37, 43, 49, 55, 61, 67, 73, 79, 85, 91, 97,
    2, 8, 14, 20, 26, 32, 38, 44, 50, 56, 62, 68, 74, 80, 86, 92,
    3, 9, 15, 21, 27, 33, 39, 45, 51, 57, 63, 69, 75, 81,
    4, 10, 16, 22, 28, 34, 40, 46, 52, 58, 64, 70, 76, 82,
    5, 11, 17, 23, 29, 35, 41, 47, 53, 59, 65
];

export function Initialize() {
    device.setName(Name());
    device.setSize(Size());
    device.setControllableLeds(vLedNames, vLedPositions);
    device.write([0x04, 0x8C, 0x00, 0x0B, 0x30, 0x50, 0x01], 64);
}

export function Render() {
    sendColors();
}

export function Shutdown(SystemSuspending) {
    sendColors(true);
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
