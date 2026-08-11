/* ==========================================================================
   FitTrack Daily Weight Tracker - JavaScript Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'fittrack_weight_logs_v1';

    let state = {
        userHeight: 172,     // cm
        targetWeight: 60.0,  // kg
        logs: [],            // Array of { id, date, weight, bodyFat, note }
        streakDays: 0,
        lastCheckDate: null
    };

    // --- DOM Elements ---
    const userHeightInput = document.getElementById('userHeight');
    const targetWeightInput = document.getElementById('targetWeight');
    const weightForm = document.getElementById('weightForm');
    const inputWeight = document.getElementById('inputWeight');
    const inputBodyFat = document.getElementById('inputBodyFat');
    const inputNote = document.getElementById('inputNote');
    const currentDateTag = document.getElementById('currentDateTag');

    // Dashboard Elements
    const latestWeightEl = document.getElementById('latestWeight');
    const weightDiffSub = document.getElementById('weightDiffSub');
    const bmiValueEl = document.getElementById('bmiValue');
    const bmiStatusBadge = document.getElementById('bmiStatusBadge');
    const toTargetWeightEl = document.getElementById('toTargetWeight');
    const targetProgressSub = document.getElementById('targetProgressSub');
    const streakCountEl = document.getElementById('streakCount');

    // History & Chart
    const historyList = document.getElementById('historyList');
    const btnClearLogs = document.getElementById('btnClearLogs');
    const chartCanvas = document.getElementById('weightChart');
    const filterChips = document.querySelectorAll('.filter-chip');
    let chartDaysFilter = '7';

    // Set Date Tag
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    currentDateTag.textContent = todayStr;

    // --- LocalStorage Save & Load ---
    function saveState() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function loadState() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                state = JSON.parse(saved);
                userHeightInput.value = state.userHeight;
                targetWeightInput.value = state.targetWeight;
            } catch (e) {
                initSampleState();
            }
        } else {
            initSampleState();
        }
    }

    function initSampleState() {
        // Initial sample data if brand new
        state = {
            userHeight: 172,
            targetWeight: 60.0,
            logs: [
                { id: 1, date: '08-08', weight: 65.2, bodyFat: 20.1, note: '初始打卡' },
                { id: 2, date: '08-09', weight: 64.8, bodyFat: 19.8, note: '晨起空腹称量' },
                { id: 3, date: '08-10', weight: 64.3, bodyFat: 19.5, note: '控糖第3天，有效果' },
                { id: 4, date: '08-11', weight: 63.9, bodyFat: 19.2, note: '晚上跑步5公里' }
            ],
            streakDays: 4,
            lastCheckDate: todayStr
        };
        saveState();
    }

    // --- BMI Calculator ---
    function calculateBMI(weightKg, heightCm) {
        if (!weightKg || !heightCm) return { bmi: '--', label: '未知', color: '#94a3b8' };
        const heightM = heightCm / 100;
        const bmi = (weightKg / (heightM * heightM)).toFixed(1);

        let label = '正常';
        let color = '#10b981';

        if (bmi < 18.5) { label = '偏瘦'; color = '#38bdf8'; }
        else if (bmi <= 23.9) { label = '标准范围内'; color = '#10b981'; }
        else if (bmi <= 27.9) { label = '偏胖'; color = '#fbbf24'; }
        else { label = '肥胖'; color = '#f87171'; }

        return { bmi, label, color };
    }

    // --- Update Dashboard Metrics ---
    function updateUI() {
        if (state.logs.length === 0) {
            latestWeightEl.textContent = '--';
            weightDiffSub.textContent = '相比初始: --';
            bmiValueEl.textContent = '--';
            bmiStatusBadge.textContent = '暂无记录';
            toTargetWeightEl.textContent = '--';
            targetProgressSub.textContent = '完成度: 0%';
            streakCountEl.textContent = '0';
            renderHistory();
            drawChart();
            return;
        }

        // Latest log
        const latest = state.logs[state.logs.length - 1];
        const initial = state.logs[0];
        const latestW = latest.weight;
        const targetW = state.targetWeight;

        latestWeightEl.textContent = latestW.toFixed(1);

        // Diff from initial
        const diff = (latestW - initial.weight).toFixed(1);
        const diffText = diff <= 0 ? `累计已瘦 ${Math.abs(diff)} kg 🎉` : `较初始增加了 ${diff} kg`;
        weightDiffSub.textContent = diffText;

        // BMI
        const bmiInfo = calculateBMI(latestW, state.userHeight);
        bmiValueEl.textContent = bmiInfo.bmi;
        bmiStatusBadge.textContent = bmiInfo.label;
        bmiStatusBadge.style.color = bmiInfo.color;
        bmiStatusBadge.style.borderColor = bmiInfo.color;
        bmiStatusBadge.style.backgroundColor = `${bmiInfo.color}20`;

        // Target remaining
        const toTarget = (latestW - targetW).toFixed(1);
        toTargetWeightEl.textContent = Math.abs(toTarget);
        if (toTarget <= 0) {
            targetProgressSub.textContent = '🎉 已达成目标体重！';
        } else {
            const totalToLose = initial.weight - targetW;
            const progress = totalToLose > 0 ? Math.min(100, Math.max(0, Math.round(((initial.weight - latestW) / totalToLose) * 100))) : 0;
            targetProgressSub.textContent = `减重进度: ${progress}%`;
        }

        streakCountEl.textContent = state.streakDays;

        renderHistory();
        drawChart();
    }

    // --- Render History Feed ---
    function renderHistory() {
        historyList.innerHTML = '';
        const reversed = [...state.logs].reverse();

        reversed.forEach(item => {
            const li = document.createElement('li');
            li.className = 'history-item';
            li.innerHTML = `
                <div>
                    <span class="h-weight">${item.weight} kg</span>
                    ${item.bodyFat ? `<span style="font-size:0.75rem; color:#94a3b8; margin-left:8px;">体脂 ${item.bodyFat}%</span>` : ''}
                    ${item.note ? `<div class="h-note">${item.note}</div>` : ''}
                </div>
                <div class="h-meta">
                    <span class="h-date">${item.date}</span>
                </div>
            `;
            historyList.appendChild(li);
        });
    }

    // --- Canvas Line Chart Renderer ---
    function drawChart() {
        const ctx = chartCanvas.getContext('2d');
        const width = chartCanvas.width;
        const height = chartCanvas.height;

        ctx.clearRect(0, 0, width, height);

        let dataLogs = [...state.logs];
        if (chartDaysFilter === '7') dataLogs = dataLogs.slice(-7);
        else if (chartDaysFilter === '30') dataLogs = dataLogs.slice(-30);

        if (dataLogs.length < 2) {
            ctx.fillStyle = '#64748b';
            ctx.font = '14px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('数据积累中，打卡至少2天后展示趋势曲线...', width / 2, height / 2);
            return;
        }

        const weights = dataLogs.map(l => l.weight);
        const minW = Math.min(...weights) - 1;
        const maxW = Math.max(...weights) + 1;

        const padding = { top: 30, right: 30, bottom: 40, left: 40 };
        const chartW = width - padding.left - padding.right;
        const chartH = height - padding.top - padding.bottom;

        const points = dataLogs.map((item, idx) => {
            const x = padding.left + (idx / (dataLogs.length - 1)) * chartW;
            const y = padding.top + chartH - ((item.weight - minW) / (maxW - minW)) * chartH;
            return { x, y, weight: item.weight, date: item.date };
        });

        // Draw Area Gradient Fill
        const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
        gradient.addColorStop(0, 'rgba(0, 242, 254, 0.35)');
        gradient.addColorStop(1, 'rgba(0, 242, 254, 0.0)');

        ctx.beginPath();
        ctx.moveTo(points[0].x, height - padding.bottom);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw Line Curve
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw Data Points & Labels
        points.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#00f2fe';
            ctx.fill();
            ctx.strokeStyle = '#080b11';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Label text above point
            ctx.fillStyle = '#f8fafc';
            ctx.font = '11px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${p.weight}`, p.x, p.y - 10);

            // Date label below axis
            ctx.fillStyle = '#64748b';
            ctx.fillText(p.date, p.x, height - 12);
        });
    }

    // --- Form Submission Event ---
    weightForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const weightVal = parseFloat(inputWeight.value);
        const fatVal = inputBodyFat.value ? parseFloat(inputBodyFat.value) : null;
        const noteVal = inputNote.value.trim();

        if (weightVal > 0) {
            const shortDate = `${today.getMonth() + 1}/${today.getDate()}`;
            state.logs.push({
                id: Date.now(),
                date: shortDate,
                weight: weightVal,
                bodyFat: fatVal,
                note: noteVal
            });

            // Update streak
            if (state.lastCheckDate !== todayStr) {
                state.streakDays += 1;
                state.lastCheckDate = todayStr;
            }

            saveState();
            updateUI();

            inputWeight.value = '';
            inputBodyFat.value = '';
            inputNote.value = '';
        }
    });

    // Height & Target Change Listeners
    userHeightInput.addEventListener('change', (e) => {
        state.userHeight = parseFloat(e.target.value) || 172;
        saveState();
        updateUI();
    });

    targetWeightInput.addEventListener('change', (e) => {
        state.targetWeight = parseFloat(e.target.value) || 60.0;
        saveState();
        updateUI();
    });

    // Clear Logs
    btnClearLogs.addEventListener('click', () => {
        if (confirm('确定要清空所有体重打卡历史吗？')) {
            state.logs = [];
            state.streakDays = 0;
            saveState();
            updateUI();
        }
    });

    // Chart Filter Chips
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            chartDaysFilter = chip.dataset.days;
            drawChart();
        });
    });

    // Initialize Engine
    loadState();
    updateUI();
});
