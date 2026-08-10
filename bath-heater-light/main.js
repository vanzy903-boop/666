/* ==========================================================================
   Lumina Bath Smart Light Controller - JavaScript Interactive Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- State Variables ---
    let state = {
        brightness: 80,         // 0 - 100
        colorTemp: 4500,        // 2700K - 6500K
        mainLightActive: true,
        activeMode: 'normal',   // normal, warm1, warm2, vent, blow, dry
        timerMinutes: 0,
        timerInterval: null
    };

    // --- DOM Elements ---
    const ambientBg = document.getElementById('ambientBg');
    const lightSurface = document.getElementById('lightSurface');
    const pushBarTrack = document.getElementById('pushBarTrack');
    const pushBarFill = document.getElementById('pushBarFill');
    const pushBarHandle = document.getElementById('pushBarHandle');
    const brightnessReadout = document.getElementById('brightnessReadout');
    const pushBarTooltip = document.getElementById('pushBarTooltip');
    const colorTempRange = document.getElementById('colorTempRange');
    const activeModeTag = document.getElementById('activeModeTag');
    const fanBlade = document.getElementById('fanBlade');
    const heatCoils = document.getElementById('heatCoils');
    const powerReadout = document.getElementById('powerReadout');
    const lightSubText = document.getElementById('lightSubText');
    const timerReadout = document.getElementById('timerReadout');

    // Function Buttons
    const btnMainLight = document.getElementById('btnMainLight');
    const btnWarm1 = document.getElementById('btnWarm1');
    const btnWarm2 = document.getElementById('btnWarm2');
    const btnVent = document.getElementById('btnVent');
    const btnBlow = document.getElementById('btnBlow');
    const btnDry = document.getElementById('btnDry');

    // Preset Buttons
    const presetBtns = document.querySelectorAll('.preset-btn');
    const timerChips = document.querySelectorAll('.timer-chip[data-min]');
    const btnCancelTimer = document.getElementById('btnCancelTimer');

    // --- Kelvin Color Temp to RGB Conversion ---
    function kelvinToRGB(kelvin) {
        let temp = kelvin / 100;
        let red, green, blue;

        if (temp <= 66) {
            red = 255;
            green = temp;
            green = 99.4708025861 * Math.log(green) - 161.1195681661;
            if (temp <= 19) {
                blue = 0;
            } else {
                blue = temp - 10;
                blue = 138.5177312231 * Math.log(blue) - 305.0447927307;
            }
        } else {
            red = temp - 60;
            red = 329.698727446 * Math.pow(red, -0.1332047592);
            green = temp - 60;
            green = 288.1221695283 * Math.pow(green, -0.0755148492);
            blue = 255;
        }

        const clamp = (val) => Math.min(255, Math.max(0, Math.round(val)));
        return `${clamp(red)}, ${clamp(green)}, ${clamp(blue)}`;
    }

    // --- Core Visual & Light Update Engine ---
    function updateLightEngine() {
        const brightRatio = state.mainLightActive ? (state.brightness / 100) : 0;
        const rgbColor = kelvinToRGB(state.colorTemp);

        // Update CSS Custom Properties
        document.documentElement.style.setProperty('--light-brightness', brightRatio);
        document.documentElement.style.setProperty('--light-temp-rgb', rgbColor);
        document.documentElement.style.setProperty('--glow-color', `rgba(${rgbColor}, ${brightRatio * 0.45})`);

        // Update Slider UI
        pushBarFill.style.width = `${state.brightness}%`;
        pushBarHandle.style.left = `${state.brightness}%`;
        brightnessReadout.textContent = state.mainLightActive ? `${state.brightness}%` : '关';
        pushBarTooltip.textContent = `${state.brightness}%`;

        // Update Subtext
        lightSubText.textContent = state.mainLightActive ? `${state.brightness}% 开启中` : '已关闭';
        btnMainLight.classList.toggle('active', state.mainLightActive);

        calculatePower();
    }

    // --- Power Calculation ---
    function calculatePower() {
        let watts = 0;
        if (state.mainLightActive) {
            watts += Math.round(10 + (state.brightness / 100) * 35); // 10W - 45W light
        }
        if (state.activeMode === 'warm1') watts += 1200;
        if (state.activeMode === 'warm2') watts += 2400;
        if (state.activeMode === 'vent') watts += 35;
        if (state.activeMode === 'blow') watts += 40;
        if (state.activeMode === 'dry') watts += 1500;

        powerReadout.textContent = `${watts} W`;
    }

    // --- Mode Switcher ---
    function setMode(mode) {
        state.activeMode = mode;

        // Reset Visual States
        fanBlade.classList.remove('spinning');
        heatCoils.classList.remove('glowing');
        [btnWarm1, btnWarm2, btnVent, btnBlow, btnDry].forEach(btn => btn.classList.remove('active'));

        switch (mode) {
            case 'warm1':
                activeModeTag.textContent = '暖风一档模式';
                heatCoils.classList.add('glowing');
                btnWarm1.classList.add('active');
                break;
            case 'warm2':
                activeModeTag.textContent = '强劲暖风二档';
                heatCoils.classList.add('glowing');
                fanBlade.classList.add('spinning');
                btnWarm2.classList.add('active');
                break;
            case 'vent':
                activeModeTag.textContent = '换气排风模式';
                fanBlade.classList.add('spinning');
                btnVent.classList.add('active');
                break;
            case 'blow':
                activeModeTag.textContent = '自然凉风模式';
                fanBlade.classList.add('spinning');
                btnBlow.classList.add('active');
                break;
            case 'dry':
                activeModeTag.textContent = '智能除湿烘干';
                heatCoils.classList.add('glowing');
                fanBlade.classList.add('spinning');
                btnDry.classList.add('active');
                break;
            default:
                activeModeTag.textContent = '日常推光照明';
                break;
        }

        calculatePower();
    }

    // --- Interactive Push Light Touch/Drag Handling ---
    let isDragging = false;

    function handlePushMove(e) {
        const rect = pushBarTrack.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        let percentage = Math.round(((clientX - rect.left) / rect.width) * 100);
        percentage = Math.max(0, Math.min(100, percentage));

        state.brightness = percentage;
        if (percentage > 0 && !state.mainLightActive) {
            state.mainLightActive = true;
        }
        updateLightEngine();
    }

    pushBarTrack.addEventListener('mousedown', (e) => {
        isDragging = true;
        handlePushMove(e);
    });

    window.addEventListener('mousemove', (e) => {
        if (isDragging) handlePushMove(e);
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Touch Support for Mobile
    pushBarTrack.addEventListener('touchstart', (e) => {
        isDragging = true;
        handlePushMove(e);
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (isDragging) handlePushMove(e);
    }, { passive: true });

    window.addEventListener('touchend', () => {
        isDragging = false;
    });

    // Color Temp Range Event
    colorTempRange.addEventListener('input', (e) => {
        state.colorTemp = parseInt(e.target.value);
        updateLightEngine();
    });

    // Function Buttons Click Listeners
    btnMainLight.addEventListener('click', () => {
        state.mainLightActive = !state.mainLightActive;
        updateLightEngine();
    });

    btnWarm1.addEventListener('click', () => setMode(state.activeMode === 'warm1' ? 'normal' : 'warm1'));
    btnWarm2.addEventListener('click', () => setMode(state.activeMode === 'warm2' ? 'normal' : 'warm2'));
    btnVent.addEventListener('click', () => setMode(state.activeMode === 'vent' ? 'normal' : 'vent'));
    btnBlow.addEventListener('click', () => setMode(state.activeMode === 'blow' ? 'normal' : 'blow'));
    btnDry.addEventListener('click', () => setMode(state.activeMode === 'dry' ? 'normal' : 'dry'));

    // Presets Click Event
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            presetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const bright = parseInt(btn.dataset.brightness);
            const temp = parseInt(btn.dataset.temp);
            const mode = btn.dataset.mode;

            state.brightness = bright;
            state.colorTemp = temp;
            colorTempRange.value = temp;
            state.mainLightActive = true;

            setMode(mode === 'warm-high' ? 'warm2' : (mode === 'dry' ? 'dry' : 'normal'));
            updateLightEngine();
        });
    });

    // --- Timer System ---
    function startTimer(mins) {
        clearInterval(state.timerInterval);
        state.timerMinutes = mins;
        updateTimerDisplay();

        state.timerInterval = setInterval(() => {
            state.timerMinutes--;
            if (state.timerMinutes <= 0) {
                clearInterval(state.timerInterval);
                state.mainLightActive = false;
                setMode('normal');
                updateLightEngine();
                timerReadout.textContent = '已关机';
            } else {
                updateTimerDisplay();
            }
        }, 60000);
    }

    function updateTimerDisplay() {
        timerReadout.textContent = `${state.timerMinutes} 分钟后关闭`;
    }

    timerChips.forEach(chip => {
        chip.addEventListener('click', () => {
            timerChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            startTimer(parseInt(chip.dataset.min));
        });
    });

    btnCancelTimer.addEventListener('click', () => {
        clearInterval(state.timerInterval);
        timerChips.forEach(c => c.classList.remove('active'));
        timerReadout.textContent = '已取消';
    });

    // --- Initial Engine Launch ---
    updateLightEngine();
});
