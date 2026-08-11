/* ==========================================================================
   Luxury Wealth Vault & Savings Challenge - Enhanced Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'titan_wealth_vault_v2';

    let state = {
        targetGoal: 10000,
        targetName: '我的第一桶金 🚀',
        totalSaved: 0,
        history: [], // Array of { id, amount, timeStr, note }
        cells: [],   // 365 cells: { id, amount, done }
        lastDepositDate: null,
        streakDays: 0
    };

    // --- DOM Elements ---
    const customTargetInput = document.getElementById('customTargetInput');
    const targetNameInput = document.getElementById('targetNameInput');
    const customDepositForm = document.getElementById('customDepositForm');
    const inputDepositAmount = document.getElementById('inputDepositAmount');
    const presetChips = document.querySelectorAll('.preset-chip');
    const historyList = document.getElementById('historyList');
    const btnClearHistory = document.getElementById('btnClearHistory');

    // Overview Stats
    const percentText = document.getElementById('percentText');
    const ringCircle = document.getElementById('ringCircle');
    const savedTotalVal = document.getElementById('savedTotalVal');
    const remainingVal = document.getElementById('remainingVal');
    const depositTimes = document.getElementById('depositTimes');
    const streakDaysEl = document.getElementById('streakDays');
    const maxDepositEl = document.getElementById('maxDeposit');

    // Grid Board Elements
    const gridBoard = document.getElementById('gridBoard');
    const filterChips = document.querySelectorAll('.chip');
    let currentFilter = 'all';

    // Cell Modal Elements
    const cellModal = document.getElementById('cellModal');
    const cellModalInput = document.getElementById('cellModalInput');
    const btnCancelCellModal = document.getElementById('btnCancelCellModal');
    const btnConfirmCellModal = document.getElementById('btnConfirmCellModal');
    let activeCellId = null;

    // --- Save & Load LocalStorage ---
    function saveState() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function loadState() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                state = JSON.parse(saved);
            } catch (e) {
                initDefaultState();
            }
        } else {
            initDefaultState();
        }

        // Apply loaded settings to inputs
        customTargetInput.value = state.targetGoal;
        targetNameInput.value = state.targetName;
    }

    function initDefaultState() {
        state = {
            targetGoal: 10000,
            targetName: '我的第一桶金 🚀',
            totalSaved: 0,
            history: [],
            cells: Array.from({ length: 365 }, (_, i) => ({
                id: i + 1,
                amount: i + 1, // Default 1 to 365
                done: false
            })),
            lastDepositDate: null,
            streakDays: 0
        };
        saveState();
    }

    // --- Core Money Deposit Engine ---
    function addDeposit(amount, note = '零钱存入') {
        const numAmt = parseFloat(amount);
        if (isNaN(numAmt) || numAmt <= 0) return;

        const now = new Date();
        const timeStr = `${now.getMonth() + 1}月${now.getDate()}日 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        state.totalSaved += numAmt;
        state.history.unshift({
            id: Date.now(),
            amount: numAmt,
            timeStr: timeStr,
            note: note
        });

        // Update streak
        const todayStr = now.toDateString();
        if (state.lastDepositDate !== todayStr) {
            state.streakDays += 1;
            state.lastDepositDate = todayStr;
        }

        saveState();
        updateUI();
    }

    // --- Update UI & Stats ---
    function updateUI() {
        // Compute metrics
        const total = state.totalSaved;
        const target = state.targetGoal;
        const remaining = Math.max(0, target - total);
        const percent = Math.min(100, Math.round((total / target) * 100)) || 0;

        savedTotalVal.textContent = total.toLocaleString();
        remainingVal.textContent = remaining.toLocaleString();
        percentText.textContent = `${percent}%`;

        // Update Circular Ring SVG (Dashoffset 471)
        const circumference = 471;
        const offset = circumference - (percent / 100) * circumference;
        ringCircle.style.strokeDashoffset = offset;

        // Update Mini Stats
        depositTimes.textContent = `${state.history.length} 笔`;
        streakDaysEl.textContent = `${state.streakDays} 天 🔥`;
        const maxAmt = state.history.length > 0 ? Math.max(...state.history.map(h => h.amount)) : 0;
        maxDepositEl.textContent = `¥${maxAmt.toLocaleString()}`;

        // Render History List
        renderHistory();

        // Render Grid
        renderGrid();
    }

    function renderHistory() {
        historyList.innerHTML = '';
        if (state.history.length === 0) {
            historyList.innerHTML = '<li class="history-item" style="justify-content:center; color:#64748b;">暂无存钱记录，快存入第一笔吧！</li>';
            return;
        }

        state.history.forEach(item => {
            const li = document.createElement('li');
            li.className = 'history-item';
            li.innerHTML = `
                <div>
                    <div><strong>${item.note}</strong></div>
                    <div class="item-time">${item.timeStr}</div>
                </div>
                <div class="item-val">+ ¥${item.amount.toLocaleString()}</div>
            `;
            historyList.appendChild(li);
        });
    }

    function renderGrid() {
        gridBoard.innerHTML = '';

        const filtered = state.cells.filter(cell => {
            if (currentFilter === 'pending') return !cell.done;
            if (currentFilter === 'done') return cell.done;
            return true;
        });

        filtered.forEach(cell => {
            const el = document.createElement('div');
            el.className = `grid-cell ${cell.done ? 'done' : ''}`;
            el.innerHTML = `
                <span class="cell-day">第${cell.id}天</span>
                <span class="cell-val">${cell.done ? '✓' : `¥${cell.amount}`}</span>
            `;

            el.addEventListener('click', () => {
                if (cell.done) {
                    // Toggle off if already done
                    cell.done = false;
                    state.totalSaved = Math.max(0, state.totalSaved - cell.amount);
                    saveState();
                    updateUI();
                } else {
                    // Open custom amount modal for cell
                    activeCellId = cell.id;
                    cellModalInput.value = cell.amount;
                    cellModal.classList.add('active');
                }
            });

            gridBoard.appendChild(el);
        });
    }

    // --- Form & Preset Event Listeners ---
    customDepositForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = parseFloat(inputDepositAmount.value);
        if (val > 0) {
            addDeposit(val, '自定义自由存入');
            inputDepositAmount.value = '';
        }
    });

    presetChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const val = parseFloat(chip.dataset.val);
            addDeposit(val, `快捷加码 +¥${val}`);
        });
    });

    customTargetInput.addEventListener('change', (e) => {
        const val = parseFloat(e.target.value);
        if (val > 0) {
            state.targetGoal = val;
            saveState();
            updateUI();
        }
    });

    targetNameInput.addEventListener('change', (e) => {
        state.targetName = e.target.value;
        saveState();
    });

    btnClearHistory.addEventListener('click', () => {
        if (confirm('确定要清空流水记录吗？（总金额将清零）')) {
            state.totalSaved = 0;
            state.history = [];
            state.cells.forEach(c => c.done = false);
            saveState();
            updateUI();
        }
    });

    // Modal Event Handlers
    btnConfirmCellModal.addEventListener('click', () => {
        const val = parseFloat(cellModalInput.value);
        if (val > 0 && activeCellId) {
            const cell = state.cells.find(c => c.id === activeCellId);
            if (cell) {
                cell.amount = val;
                cell.done = true;
                addDeposit(val, `格子打卡 (第${cell.id}天)`);
            }
        }
        cellModal.classList.remove('active');
    });

    btnCancelCellModal.addEventListener('click', () => cellModal.classList.remove('active'));
    cellModal.addEventListener('click', (e) => {
        if (e.target === cellModal) cellModal.classList.remove('active');
    });

    // Filter Chips
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentFilter = chip.textContent.includes('未完成') ? 'pending' : (chip.textContent.includes('已存入') ? 'done' : 'all');
            renderGrid();
        });
    });

    // Initial Engine Start
    loadState();
    updateUI();
});
