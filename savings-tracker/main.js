/* ==========================================================================
   365-Day Money Savings Challenge - JavaScript Logic Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- State Storage Key ---
    const STORAGE_KEY = 'titan_savings_tracker_v1';

    // Default 365 Step Challenge Data (Day 1 = ¥1, Day 2 = ¥2 ... Day 365 = ¥365)
    let state = {
        planType: '365-step',
        totalTarget: 66795,
        totalDays: 365,
        gridData: [], // Array of { id, dayLabel, amount, done: boolean }
        lastCheckDate: null,
        streakDays: 0
    };

    // --- DOM Elements ---
    const planSelect = document.getElementById('planSelect');
    const gridBoard = document.getElementById('gridBoard');
    const savedAmountEl = document.getElementById('savedAmount');
    const progressPercentEl = document.getElementById('progressPercent');
    const progressBarFill = document.getElementById('progressBarFill');
    const checkedCountEl = document.getElementById('checkedCount');
    const targetTotalSub = document.getElementById('targetTotalSub');
    const daysLeftSub = document.getElementById('daysLeftSub');
    const streakDaysEl = document.getElementById('streakDays');
    
    // Chips & Buttons
    const countAllEl = document.getElementById('countAll');
    const countPendingEl = document.getElementById('countPending');
    const countDoneEl = document.getElementById('countDone');
    const chips = document.querySelectorAll('.chip');
    const btnRandomDeposit = document.getElementById('btnRandomDeposit');
    const btnResetData = document.getElementById('btnResetData');

    // Modal
    const celebrateModal = document.getElementById('celebrateModal');
    const modalDepositVal = document.getElementById('modalDepositVal');
    const closeModal = document.getElementById('closeModal');

    let currentFilter = 'all';

    // --- Generate Plan Preset Grid Data ---
    function generatePlanData(type) {
        let grid = [];
        let total = 0;
        let days = 365;

        if (type === '365-step') {
            days = 365;
            for (let i = 1; i <= 365; i++) {
                grid.push({ id: i, dayLabel: `第${i}天`, amount: i, done: false });
                total += i;
            }
        } else if (type === '100-hundred') {
            days = 100;
            for (let i = 1; i <= 100; i++) {
                grid.push({ id: i, dayLabel: `第${i}天`, amount: 100, done: false });
                total += 100;
            }
        } else if (type === '52-week') {
            days = 52;
            for (let i = 1; i <= 52; i++) {
                let amt = i * 10;
                grid.push({ id: i, dayLabel: `第${i}周`, amount: amt, done: false });
                total += amt;
            }
        } else if (type === 'custom') {
            days = 100;
            for (let i = 1; i <= 100; i++) {
                let amt = Math.floor(Math.random() * 50) + 10; // ¥10 - ¥60
                grid.push({ id: i, dayLabel: `卡片${i}`, amount: amt, done: false });
                total += amt;
            }
        }

        return { type, total, days, grid };
    }

    // --- Save & Load LocalStorage ---
    function saveState() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function loadState() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                state = parsed;
                planSelect.value = state.planType;
            } catch (e) {
                console.error("Failed to parse saved state", e);
                initNewPlan('365-step');
            }
        } else {
            initNewPlan('365-step');
        }
    }

    function initNewPlan(type) {
        const data = generatePlanData(type);
        state.planType = type;
        state.totalTarget = data.total;
        state.totalDays = data.days;
        state.gridData = data.grid;
        state.lastCheckDate = null;
        state.streakDays = 0;
        saveState();
    }

    // --- Render Grid Board ---
    function renderBoard() {
        gridBoard.innerHTML = '';

        const filtered = state.gridData.filter(item => {
            if (currentFilter === 'pending') return !item.done;
            if (currentFilter === 'done') return item.done;
            return true;
        });

        filtered.forEach(item => {
            const cell = document.createElement('div');
            cell.className = `grid-cell ${item.done ? 'done' : ''}`;
            cell.dataset.id = item.id;

            cell.innerHTML = `
                <span class="cell-day">${item.dayLabel}</span>
                <span class="cell-val">${item.done ? '✓' : `¥${item.amount}`}</span>
                ${item.done ? `<span class="cell-icon">已存¥${item.amount}</span>` : ''}
            `;

            cell.addEventListener('click', () => toggleDeposit(item.id));
            gridBoard.appendChild(cell);
        });

        updateDashboard();
    }

    // --- Update Dashboard Stats ---
    function updateDashboard() {
        const doneItems = state.gridData.filter(i => i.done);
        const currentSaved = doneItems.reduce((sum, i) => sum + i.amount, 0);
        const doneCount = doneItems.length;
        const percent = Math.round((currentSaved / state.totalTarget) * 100) || 0;

        savedAmountEl.textContent = currentSaved.toLocaleString();
        targetTotalSub.textContent = `目标金额: ¥${state.totalTarget.toLocaleString()}`;
        
        progressPercentEl.textContent = percent;
        progressBarFill.style.width = `${percent}%`;

        checkedCountEl.textContent = doneCount;
        daysLeftSub.textContent = `还需打卡: ${state.totalDays - doneCount} 天`;

        streakDaysEl.textContent = state.streakDays;

        // Update Filter Chip Counter Tags
        countAllEl.textContent = state.gridData.length;
        countPendingEl.textContent = state.gridData.length - doneCount;
        countDoneEl.textContent = doneCount;
    }

    // --- Toggle Deposit Cell ---
    function toggleDeposit(id) {
        const item = state.gridData.find(i => i.id === id);
        if (!item) return;

        item.done = !item.done;

        if (item.done) {
            // Check streak
            const today = new Date().toDateString();
            if (state.lastCheckDate !== today) {
                state.streakDays += 1;
                state.lastCheckDate = today;
            }
            // Show celebration modal
            modalDepositVal.textContent = item.amount;
            celebrateModal.classList.add('active');
        }

        saveState();
        renderBoard();
    }

    // --- Random Deposit Picker ---
    btnRandomDeposit.addEventListener('click', () => {
        const pending = state.gridData.filter(i => !i.done);
        if (pending.length === 0) {
            alert('🎉 恭喜！所有格子均已存满，任务全面达成！');
            return;
        }

        const randomIndex = Math.floor(Math.random() * pending.length);
        const randomItem = pending[randomIndex];
        toggleDeposit(randomItem.id);
    });

    // --- Filter Chips ---
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentFilter = chip.dataset.filter;
            renderBoard();
        });
    });

    // --- Reset Plan Data ---
    btnResetData.addEventListener('click', () => {
        if (confirm('确定要重新开始存钱计划吗？之前的数据将被清空。')) {
            initNewPlan(state.planType);
            renderBoard();
        }
    });

    // --- Plan Select Change Listener ---
    planSelect.addEventListener('change', (e) => {
        if (confirm('切换存钱模式将初始化新的打卡格子，是否继续？')) {
            initNewPlan(e.target.value);
            renderBoard();
        } else {
            planSelect.value = state.planType;
        }
    });

    // Modal Close
    closeModal.addEventListener('click', () => celebrateModal.classList.remove('active'));
    celebrateModal.addEventListener('click', (e) => {
        if (e.target === celebrateModal) celebrateModal.classList.remove('active');
    });

    // --- Initialize ---
    loadState();
    renderBoard();
});
