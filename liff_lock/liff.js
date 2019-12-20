// User service UUID: Change this to your generated service UUID
const USER_SERVICE_UUID         = '4a6e7693-c577-4408-aba1-63ef87e483c8'; // Lock, Button

// User service characteristics
const LOCK_CHARACTERISTIC_UUID   = 'E9062E71-9E62-4BC6-B0D3-35CDCD9B027B';
const BTN_CHARACTERISTIC_UUID   = '62FBD229-6EDD-4D1A-B554-5C4E1BB29169';

// PSDI Service UUID: Fixed value for Developer Trial
const PSDI_SERVICE_UUID         = 'E625601E-9E55-4597-A598-76018A0D293D'; // Device ID
const PSDI_CHARACTERISTIC_UUID  = '26e2b12b-85f0-4f3f-9fdd-91d114270e6e';

// UI settings
let lockState = false; // true: Lock on, false: Lock off
let clickCount = 0;

// -------------- //
// On window load //
// -------------- //

window.onload = () => {
    initializeApp();
};

// ----------------- //
// Handler functions //
// ----------------- //

function handlerToggleLock() {
    lockState = !lockState;

    uiToggleLockButton(lockState);
    liffToggleDeviceLockState(lockState);
}

// ------------ //
// UI functions //
// ------------ //

function uiToggleLockButton(state) {
    const el = document.getElementById("btn-lock-toggle");
    el.innerText = state ? "Locked" : "Unlock";
    if (state) {
      el.classList.add("locked");
    } else {
      el.classList.remove("locked");
    }
}
function handlerToggleOpen(state) {
    const el = document.getElementById("btn-open-toggle");
    el.innerText = state ? "Open" : "Opening";
    el.classList.add("active");
    liffToggleDeviceOpenState();
    el.classList.remove("active");
    el.innerText = state ? "Opening" : "Open";
}

// function uiCountPressButton() {
//     clickCount++;

//     const el = document.getElementById("click-count");
//     el.innerText = clickCount;
// }

// function uiToggleStateButton(pressed) {
//     const el = document.getElementById("btn-state");

//     if (pressed) {
//         el.classList.add("pressed");
//         el.innerText = "Pressed";
//     } else {
//         el.classList.remove("pressed");
//         el.innerText = "Released";
//     }
// }

function uiToggleDeviceConnected(connected) {
    const elStatus = document.getElementById("status");
    const elControls = document.getElementById("controls");

    elStatus.classList.remove("error");

    if (connected) {
        // Hide loading animation
        uiToggleLoadingAnimation(false);
        // Show status connected
        elStatus.classList.remove("inactive");
        elStatus.classList.add("success");
        elStatus.innerText = "Device connected";
        // Show controls
        elControls.classList.remove("hidden");
    } else {
        // Show loading animation
        uiToggleLoadingAnimation(true);
        // Show status disconnected
        elStatus.classList.remove("success");
        elStatus.classList.add("inactive");
        elStatus.innerText = "Device disconnected";
        // Hide controls
        elControls.classList.add("hidden");
    }
}

function uiToggleLoadingAnimation(isLoading) {
    const elLoading = document.getElementById("loading-animation");

    if (isLoading) {
        // Show loading animation
        elLoading.classList.remove("hidden");
    } else {
        // Hide loading animation
        elLoading.classList.add("hidden");
    }
}

function uiStatusError(message, showLoadingAnimation) {
    uiToggleLoadingAnimation(showLoadingAnimation);

    const elStatus = document.getElementById("status");
    const elControls = document.getElementById("controls");

    // Show status error
    elStatus.classList.remove("success");
    elStatus.classList.remove("inactive");
    elStatus.classList.add("error");
    elStatus.innerText = message;

    // Hide controls
    elControls.classList.add("hidden");
}

function makeErrorMsg(errorObj) {
    return "Error\n" + errorObj.code + "\n" + errorObj.message;
}

// -------------- //
// LIFF functions //
// -------------- //

function initializeApp() {
    liff.init(() => initializeLiff(), error => uiStatusError(makeErrorMsg(error), false));
}

function initializeLiff() {
    liff.initPlugins(['bluetooth']).then(() => {
        liffCheckAvailablityAndDo(() => liffRequestDevice());
    }).catch(error => {
        uiStatusError(makeErrorMsg(error), false);
    });
}

function liffCheckAvailablityAndDo(callbackIfAvailable) {
    // Check Bluetooth availability
    liff.bluetooth.getAvailability().then(isAvailable => {
        if (isAvailable) {
            uiToggleDeviceConnected(false);
            callbackIfAvailable();
        } else {
            uiStatusError("Bluetooth not available", true);
            setTimeout(() => liffCheckAvailablityAndDo(callbackIfAvailable), 10000);
        }
    }).catch(error => {
        uiStatusError(makeErrorMsg(error), false);
    });;
}

function liffRequestDevice() {
    liff.bluetooth.requestDevice().then(device => {
        liffConnectToDevice(device);
    }).catch(error => {
        uiStatusError(makeErrorMsg(error), false);
    });
}

function liffConnectToDevice(device) {
    device.gatt.connect().then(() => {
        document.getElementById("device-name").innerText = device.name;
        // alert(device.name);
        document.getElementById("device-id").innerText = device.id;
        // alert(device.id);

        // Show status connected
        uiToggleDeviceConnected(true);

        // Get service
        device.gatt.getPrimaryService(USER_SERVICE_UUID).then(service => {
            liffGetUserService(service);
        }).catch(error => {
            uiStatusError(makeErrorMsg(error), false);
        });
        device.gatt.getPrimaryService(PSDI_SERVICE_UUID).then(service => {
            liffGetPSDIService(service);
        }).catch(error => {
            uiStatusError(makeErrorMsg(error), false);
        });

        // Device disconnect callback
        const disconnectCallback = () => {
            // Show status disconnected
            uiToggleDeviceConnected(false);

            // Remove disconnect callback
            device.removeEventListener('gattserverdisconnected', disconnectCallback);

            // Reset lock state
            lockState = false;
            // Reset UI elements
            uiTogglelockButton(false);
            uiToggleStateButton(false);

            // Try to reconnect
            initializeLiff();
        };

        device.addEventListener('gattserverdisconnected', disconnectCallback);
    }).catch(error => {
        uiStatusError(makeErrorMsg(error), false);
    });
}

function liffGetUserService(service) {
    // Button pressed state
    // service.getCharacteristic(BTN_CHARACTERISTIC_UUID).then(characteristic => {
    //     liffGetButtonStateCharacteristic(characteristic);
    // }).catch(error => {
    //     uiStatusError(makeErrorMsg(error), false);
    // });
    // Toggle Open
    // service.getCharacteristic(BTN_CHARACTERISTIC_UUID).then(characteristic => {
    //     window.btncharacteristic = characteristic;
    // }).catch(error => {
    //     uiStatusError(makeErrorMsg(error), false);
    // });
    // Toggle Lock
    service.getCharacteristic(LOCK_CHARACTERISTIC_UUID).then(characteristic => {
        window.lockCharacteristic = characteristic;
        // Switch off by default
        liffToggleDeviceLockState(false)
    }).catch(error => {
        uiStatusError(makeErrorMsg(error), false);
    });
}

function liffGetPSDIService(service) {
    // Get PSDI value
    service.getCharacteristic(PSDI_CHARACTERISTIC_UUID).then(characteristic => {
        return characteristic.readValue();
    }).then(value => {
        // Byte array to hex string
        const psdi = new Uint8Array(value.buffer)
            .reduce((output, byte) => output + ("0" + byte.toString(16)).slice(-2), "");
        alert(psdi);
        document.getElementById("device-psdi").innerText = psdi;
    }).catch(error => {
        uiStatusError(makeErrorMsg(error), false);
    });
}

// function liffGetButtonStateCharacteristic(characteristic) {
//     // Add notification hook for button state
//     // (Get notified when button state changes)
//     characteristic.startNotifications().then(() => {
//         characteristic.addEventListener('characteristicvaluechanged', e => {
//             const val = (new Uint8Array(e.target.value.buffer))[0];
//             if (val > 0) {
//                 // press
//                 uiToggleStateButton(true);
//             } else {
//                 // release
//                 uiToggleStateButton(false);
//                 uiCountPressButton();
//             }
//         });
//     }).catch(error => {
//         uiStatusError(makeErrorMsg(error), false);
//     });
// }

function liffToggleDeviceLockState(state) {
    // on: 0x01
    // off: 0x00
    window.lockCharacteristic.writeValue(
        state ? new Uint8Array([0x01]) : new Uint8Array([0x00])
    ).catch(error => {
        uiStatusError(makeErrorMsg(error), false);
    });
}
function liffToggleDeviceOpenState() {
    // open: 0x10
    window.lockCharacteristic.writeValue(new Uint8Array([0x02])).catch(error => {
        uiStatusError(makeErrorMsg(error), false);
    });
}


