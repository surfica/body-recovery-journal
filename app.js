/* ==========================================
   ✨ 優雅日常 V2.0 - 身體恢復日記核心控制邏輯
   ========================================== */

// 1. 每日一句療癒密語判斷庫
const dailyQuotes = [
    { icon: "🌷", text: "身體沒有背叛妳，它只是誠實地反映昨天。" },
    { icon: "🌼", text: "慢慢變瘦的人，不是最努力的人，而是最穩定的人。" },
    { icon: "🌸", text: "今天的數字，只是身體昨天努力的結果，溫柔對待它。" },
    { icon: "🌿", text: "好好吃飯，認真休息，身體自然會給妳最美妙的回應。" },
    { icon: "🌱", text: "不要因為一天的波動而焦慮，那是水分的探戈，不是脂肪的累積。" },
    { icon: "🍃", text: "穩定就是最好的減脂，聽聽身體的聲音，妳做得很棒。" }
];

// 初始化全域變數
let appData = JSON.parse(localStorage.getItem('weightDietLog')) || [];
let weightChart = null;
let diffChart = null;
let currentDisplayRange = 7;
let selectedMood = "";
let selectedStatuses = [];

// 2. 啟動載入
document.addEventListener('DOMContentLoaded', () => {
    // 設定預設日期為今天
    document.getElementById('dateInput').value = new Date().toISOString().split('T')[0];
    
    // 初始化隨機語錄
    const randomQuote = dailyQuotes[Math.floor(Math.random() * dailyQuotes.length)];
    document.getElementById('quoteIcon').innerText = randomQuote.icon;
    document.getElementById('quoteText').innerText = randomQuote.text;

    // 綁定心情單選按鈕事件
    document.querySelectorAll('#moodGroup .mood-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('#moodGroup .mood-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            selectedMood = this.getAttribute('data-mood');
        });
    });

    // 綁定身體狀態複選按鈕事件
    document.querySelectorAll('#statusGroup .status-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const status = this.getAttribute('data-status');
            if (this.classList.contains('selected')) {
                this.classList.remove('selected');
                selectedStatuses = selectedStatuses.filter(s => s !== status);
            } else {
                this.classList.add('selected');
                selectedStatuses.push(status);
            }
        });
    });

    // 表單提交事件
    document.getElementById('logForm').addEventListener('submit', handleFormSubmit);

    // 初始渲染
    updateDashboard();
});

// 3. 處理數據提交
function handleFormSubmit(e) {
    e.preventDefault();
    const date = document.getElementById('dateInput').value;
    const bedtime = parseFloat(document.getElementById('bedtimeWeight').value) || null;
    const morning = parseFloat(document.getElementById('morningWeight').value) || null;
    
    // 收集分餐數據
    const meals = {
        breakfast: document.getElementById('mealBreakfast').value.trim(),
        lunch: document.getElementById('mealLunch').value.trim(),
        dinner: document.getElementById('mealDinner').value.trim(),
        snack: document.getElementById('mealSnack').value.trim()
    };

    const existingIndex = appData.findIndex(item => item.date === date);
    const logEntry = {
        date, bedtime, morning, meals,
        mood: selectedMood,
        statuses: [...selectedStatuses]
    };

    if (existingIndex > -1) { appData[existingIndex] = logEntry; } else { appData.push(logEntry); }

    // 排序並存入 localStorage
    appData.sort((a, b) => new Date(a.date) - new Date(b.date));
    localStorage.setItem('weightDietLog', JSON.stringify(appData));

    // 表單重設
    document.getElementById('bedtimeWeight').value = '';
    document.getElementById('morningWeight').value = '';
    document.getElementById('mealBreakfast').value = '';
    document.getElementById('mealLunch').value = '';
    document.getElementById('mealDinner').value = '';
    document.getElementById('mealSnack').value = '';
    document.querySelectorAll('#moodGroup .mood-btn').forEach(b => b.classList.remove('selected'));
    document.querySelectorAll('#statusGroup .status-btn').forEach(b => b.classList.remove('selected'));
    selectedMood = "";
    selectedStatuses = [];

    // 更新畫面
    updateDashboard();
}

// 4. 更新整個儀表板資料與圖表
function updateDashboard() {
    updateCharts();
    calculateSummaryCard();
    renderHistoryList();
    checkWeeklyReport();
}

// 5. 核心生理恢復分析報告 (Apple Health V2.0 改良版)
function generateInsight(currentItem, nextItem) {
    // 抓取今天的所有食物與狀態文字
    const m = currentItem.meals || {};
    const allDietText = `${m.breakfast} ${m.lunch} ${m.dinner} ${m.snack} ${currentItem.statuses?.join(' ') || ''}`.toLowerCase();
    
    // 關鍵字字典
    const goodKeywords = { '水': '補水', '清淡': '清淡', '原型': '原型', '菜': '蔬菜', '魚': '優質魚類', '雞': '低脂雞肉', '蛋': '蛋類', '芭樂': '芭樂', '番茄': '番茄', '地瓜': '地瓜', '運動': '運動運動' };
    const badKeywords = { '火鍋': '火鍋', '泡麵': '泡麵', '甜': '甜點', '蛋糕': '蛋糕', '炸': '炸物', '鹽酥雞': '鹽酥雞', '醬': '沾醬', '燒肉': '燒肉', '飲料': '甜飲', '奶茶': '奶茶', '披薩': '披薩', '熬夜': '熬夜' };

    let goodFoods = [];
    let badFoods = [];
    for (let key in goodKeywords) { if (allDietText.includes(key)) goodFoods.push(goodKeywords[key]); }
    for (let key in badKeywords) { if (allDietText.includes(key)) badFoods.push(badKeywords[key]); }

    // 核心因果修正：今天白天的飲食，其因果代價與恢復成果，由「明天的過夜排空量」決定
    let nextDiff = null;
    if (nextItem && nextItem.bedtime !== null && nextItem.morning !== null) {
        nextDiff = parseFloat((nextItem.bedtime - nextItem.morning).toFixed(2));
    }

    let report = {
        badgeClass: "badge-recovery-neutral",
        badgeText: "🤍 正常波動",
        stars: "★★★☆☆",
        advice: "✍️ 紀錄已安全儲存。記得在明天補上數據，系統就會精準為您生成隔夜身體恢復報告喔！",
        foods: goodFoods.concat(badFoods)
    };

    if (nextDiff !== null) {
        if (nextDiff >= 0.6) {
            report.badgeClass = "badge-recovery-good";
            report.badgeText = "🌸 恢復很好";
            report.stars = "★★★★★";
            report.advice = `昨天的飲食讓身體在過夜期間得到了極佳的修復，順暢排空了 ${nextDiff}kg！${goodFoods.length > 0 ? '其中記錄到的【' + goodFoods.join('、') + '】是妳的恢復神隊友，身體非常喜歡。' : '這樣的節奏對身體十分友善，請繼續保持穩定的步調。'}<br><strong class='text-emerald-600 block mt-1'>❤️ 今日提醒：今天正常吃即可，不需要刻意少吃，穩定最重要。</strong>`;
        } else if (nextDiff >= 0.4 && nextDiff < 0.6) {
            report.badgeClass = "badge-recovery-stable";
            report.badgeText = "🌿 恢復穩定";
            report.stars = "★★★★☆";
            report.advice = `過夜排空達到了平穩的 ${nextDiff}kg，代表身體在正常的節奏中代謝。昨天的飲食搭配十分得當，請繼續傾聽內心的聲音，享受輕盈。`;
        } else if (nextDiff >= 0 && nextDiff < 0.4) {
            report.badgeClass = "badge-recovery-retention";
            report.badgeText = "🌧 水分滯留";
            report.stars = "★★☆☆☆";
            report.advice = `昨天的飲食可能讓身體保留了較多水分，因此今天的過夜排空較少（僅 ${nextDiff}kg）。<span class='font-semibold'>這完全不代表變胖</span>，而是水分在探戈。${badFoods.length > 0 ? '或許是【' + badFoods.join('、') + '】中的鈉含量或精緻糖悄悄鎖住了水分。' : '提醒今天可以多補充水分、增加蔬菜攝取，再觀察隔天的變化。'}<br><strong class='text-amber-700 block mt-1'>❤️ 今日提醒：今天多喝水、多吃點高鉀蔬菜（如菠菜、香蕉），不用感到焦慮。</strong>`;
        } else {
            report.badgeClass = "badge-recovery-rest";
            report.badgeText = "💛 身體需要休息";
            report.stars = "★☆☆☆☆";
            report.advice = `今早數據出現了微幅回升或滯留。昨天的生活節奏或外食、熬夜可能讓身體感到了一點壓力和疲憊。請不要責怪體重，這只是身體在對妳訴說它需要溫柔的呵護。<br><strong class='text-blue-600 block mt-1'>❤️ 今日提醒：今晚試著早睡半小時，多喝水，給予身體自我修復的充足時間。</strong>`;
        }
    } else {
        // 沒有明天的資料時，提供預判
        if (badFoods.length > 0) {
            report.advice = `今日飲食中包含了【${badFoods.join('、')}】。別擔心，等明早體重輸入後，系統將精準揭曉它的隔夜恢復觀察報告！今天記得多補充水分唷。`;
        } else if (goodFoods.length > 0) {
            report.advice = `捕捉到身體修復需要的原型食材【${goodFoods.join('、')}】！明早補齊體重數據，就能連連看這道豐富餐點帶來的順暢威力囉。`;
        }
    }

    return report;
}

// 6. 📊 渲染最近 7 天摘要卡片 (排行榜計算)
function calculateSummaryCard() {
    if (appData.length < 2) {
        document.getElementById('avgDiffText').innerText = "-- kg";
        document.getElementById('avgStars').innerText = "☆☆☆☆☆";
        document.getElementById('compareText').innerText = "靜待幾天數據累積...";
        return;
    }

    const last7Days = appData.slice(-7);
    let totalDiff = 0;
    let validCount = 0;
    let foodLikes = {};
    let waterTraps = {};

    last7Days.forEach(item => {
        if (item.bedtime !== null && item.morning !== null) {
            totalDiff += (item.bedtime - item.morning);
            validCount++;
        }
        
        // 排行榜計數邏輯
        const m = item.meals || {};
        const text = `${m.breakfast} ${m.lunch} ${m.dinner} ${m.snack}`.toLowerCase();
        const keywords = ['雞胸', '地瓜', '芭樂', '蔬菜', '青菜', '火鍋', '炸雞', '奶茶', '泡麵', '披薩'];
        
        keywords.forEach(kw => {
            if (text.includes(kw)) {
                let diff = (item.bedtime - item.morning) || 0.4;
                if (diff >= 0.5) { foodLikes[kw] = (foodLikes[kw] || 0) + 1; }
                else if (diff < 0.4) { waterTraps[kw] = (waterTraps[kw] || 0) + 1; }
            }
        });
    });

    if (validCount === 0) {
        document.getElementById('avgDiffText').innerText = "-- kg";
        return;
    }

    const avgDiff = parseFloat((totalDiff / validCount).toFixed(2));
    document.getElementById('avgDiffText').innerText = `${avgDiff} kg`;

    // 評星
    let stars = "★★★☆☆";
    if (avgDiff >= 0.55) stars = "★★★★★";
    else if (avgDiff >= 0.45) stars = "★★★★☆";
    else if (avgDiff >= 0.35) stars = "★★★☆☆";
    else stars = "★★☆☆☆";
    document.getElementById('avgStars').innerText = stars;

    // 與上週對比 (模擬或計算前 7 天)
    if (appData.length >= 14) {
        const prev7Days = appData.slice(-14, -7);
        let prevTotal = 0, prevCount = 0;
        prev7Days.forEach(item => {
            if (item.bedtime !== null && item.morning !== null) { prevTotal += (item.bedtime - item.morning); prevCount++; }
        });
        if (prevCount > 0) {
            const prevAvg = prevTotal / prevCount;
            const gap = parseFloat((avgDiff - prevAvg).toFixed(2));
            if (gap > 0) { document.getElementById('compareText').innerHTML = `⬆️ 比上週提升 <span class="text-emerald-600 font-bold">${gap}kg</span>`; }
            else if (gap < 0) { document.getElementById('compareText').innerHTML = `⬇️ 比上週微降 <span class="text-rose-500 font-bold">${Math.abs(gap)}kg</span>`; }
            else { document.getElementById('compareText').innerText = "➡️ 與上週完全持平"; }
        }
    } else {
        document.getElementById('compareText').innerText = "數據穩定累積中";
    }

    // 將排行暫存給週報使用
    window.currentFoodLikes = Object.keys(foodLikes).sort((a,b) => foodLikes[b] - foodLikes[a]).slice(0,3);
    window.currentWaterTraps = Object.keys(waterTraps).sort((a,b) => waterTraps[b] - waterTraps[a]).slice(0,3);
}

// 7. 📅 星期日每週身體週報機制
function checkWeeklyReport() {
    const reportCard = document.getElementById('weeklyReportCard');
    const today = new Date();
    
    // 如果是星期日 (0)，或者資料累積大於5筆，我們就優雅地展示本週週報
    if (today.getDay() === 0 && appData.length >= 4) {
        const last7Days = appData.slice(-7);
        let totalDiff = 0, count = 0, happyCount = 0;
        last7Days.forEach(d => {
            if (d.bedtime !== null && d.morning !== null) { totalDiff += (d.bedtime - d.morning); count++; }
            if (d.mood === "很開心" || d.mood === "平靜") happyCount++;
        });
        const avg = (totalDiff / (count || 1)).toFixed(2);

        const likes = window.currentFoodLikes?.length > 0 ? window.currentFoodLikes : ['雞胸', '青菜', '地瓜'];
        const traps = window.currentWaterTraps?.length > 0 ? window.currentWaterTraps : ['火鍋', '炸雞', '奶茶'];

        reportCard.innerHTML = `
            <div class="text-center border-b border-pink-200/40 pb-2 mb-3">
                <span class="text-xs font-bold uppercase tracking-widest text-pink-400">📅 本週身體復原週報</span>
            </div>
            <div class="text-xs space-y-2 text-stone-600 leading-relaxed">
                <p>✨ <b>本週平均過夜排空：</b> <span class="heading-pink font-bold">${avg}kg</span></p>
                <div class="grid grid-cols-2 gap-2 my-2 py-1 bg-white/40 rounded-xl p-2 text-[11px]">
                    <div>
                        <span class="text-emerald-700 block font-medium">🥇 身體最喜歡：</span>
                        ${likes.map((f, i) => `${i+1}. ${f}`).join('<br>')}
                    </div>
                    <div>
                        <span class="text-rose-700 block font-medium">⏳ 容易水分滯留：</span>
                        ${traps.map((f, i) => `${i+1}. ${f}`).join('<br>')}
                    </div>
                </div>
                <p>🌸 <b>本週心情基調：</b> 溫柔平靜居多 🤍</p>
                <p class="text-[11px] italic opacity-80 pt-1 text-center border-t border-stone-200/30 heading-pink font-medium">
                    「妳這週照顧身體照顧得很好，不需要再更少吃，穩定就是最好的減脂。」
                </p>
            </div>
        `;
        reportCard.classList.remove('hidden');
    } else {
        reportCard.classList.add('hidden');
    }
}

// 8. 📜 渲染歷史紀錄清單
function renderHistoryList() {
    const container = document.getElementById('historyList');
    container.innerHTML = '';

    if (appData.length === 0) {
        container.innerHTML = `<p class="text-xs opacity-40 text-center py-8 tracking-wide">靜待第一筆溫柔手札的落筆...</p>`;
        return;
    }

    // 由新到舊呈現
    [...appData].reverse().forEach((item, revIndex) => {
        const originalIndex = appData.length - 1 - revIndex;
        const nextItem = appData[originalIndex + 1] || null; // 抓取生理時鐘的下一天

        const singleDiff = (item.bedtime !== null && item.morning !== null) ? (item.bedtime - item.morning) : null;
        const diffText = singleDiff !== null ? ` (當夜排空: -${singleDiff.toFixed(2)}kg)` : '';

        // 取得 Apple Health 風格分析內容
        const report = generateInsight(item, nextItem);

        const card = document.createElement('div');
        card.className = "satin-card p-5 rounded-2xl relative transition duration-300 border-l-4";
        card.style.borderLeftColor = report.badgeText.includes('很好') || report.badgeText.includes('穩定') ? '#9CAF9C' : '#D49B9B';
        
        const m = item.meals || { breakfast: '', lunch: '', dinner: '', snack: '' };
        const foodDisplay = [
            m.breakfast ? `🥣 ${m.breakfast}` : '',
            m.lunch ? `🍱 ${m.lunch}` : '',
            m.dinner ? `🍝 ${m.dinner}` : '',
            m.snack ? `🍪 ${m.snack}` : ''
        ].filter(Boolean).join(' ‧ ') || '未記錄飲食內容';

        card.innerHTML = `
            <div class="flex justify-between items-center mb-2.5">
                <div class="flex items-center space-x-2">
                    <span class="text-xs font-bold text-stone-500">${item.date}</span>
                    <span class="text-[10px] px-2.5 py-0.5 rounded-full font-medium ${report.badgeClass}">${report.badgeText}</span>
                </div>
                <button onclick="deleteLog(${originalIndex})" class="text-[11px] opacity-30 hover:opacity-100 hover:text-red-500 cursor-pointer">隱藏</button>
            </div>
            
            <div class="text-xs space-y-1.5 opacity-90 border-b border-stone-200/30 pb-2.5 leading-relaxed">
                <p><strong class="opacity-60 font-medium">⚖️ 體重：</strong> 昨晚 ${item.bedtime || '--'}kg ➔ 今早 ${item.morning || '--'}kg <span class="text-[11px] font-medium text-stone-400">${diffText}</span></p>
                <p><strong class="opacity-60 font-medium">🍽 飲食：</strong> <span class="text-stone-600">${foodDisplay}</span></p>
                <p><strong class="opacity-60 font-medium">💭 狀態：</strong> <span class="text-stone-500">心情「${item.mood || '平靜'}」${item.statuses?.length > 0 ? ' ‧ 身體標籤：' + item.statuses.join('、') : ''}</span></p>
            </div>

            <div class="mt-2.5 text-xs p-2.5 rounded-xl bg-stone-50/60 text-stone-600 space-y-1">
                <div class="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider opacity-50">
                    <span>🌙 隔夜恢復觀察報告：</span>
                    <span class="text-amber-500/90 font-mono tracking-normal">${report.stars}</span>
                </div>
                <p class="text-[11px] leading-relaxed">${report.advice}</p>
            </div>
        `;
        container.appendChild(card);
    });
}

// 9. 📊 建立完美的 Chart.js 折線與長條雙圖表
function changeRange(days) {
    currentDisplayRange = days;
    document.querySelectorAll('.range-btn').forEach(btn => btn.classList.remove('active'));
    if(days === 7) document.getElementById('btn-7').classList.add('active');
    if(days === 30) document.getElementById('btn-30').classList.add('active');
    if(days === 0) document.getElementById('btn-0').classList.add('active');
    updateDashboard();
}

function updateCharts() {
    let filteredData = [...appData];
    if (currentDisplayRange > 0 && appData.length > currentDisplayRange) {
        filteredData = appData.slice(-currentDisplayRange);
    }

    const labels = filteredData.map(item => item.date.slice(5));
    const bedtimeData = filteredData.map(item => item.bedtime);
    const morningData = filteredData.map(item => item.morning);
    const diffData = filteredData.map(item => (item.bedtime !== null && item.morning !== null) ? parseFloat((item.bedtime - item.morning).toFixed(2)) : null);

    const isLongRange = filteredData.length > 15;

    // A. 體重折線圖 (今早=莫蘭迪粉，昨晚=莫蘭迪綠)
    const ctxWeight = document.getElementById('weightChart').getContext('2d');
    if (weightChart) weightChart.destroy();
    weightChart = new Chart(ctxWeight, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '昨晚體重',
                    data: bedtimeData,
                    borderColor: '#9CAF9C', // 莫蘭迪綠
                    backgroundColor: '#9CAF9C',
                    borderWidth: 2,
                    pointBackgroundColor: '#9CAF9C',
                    pointRadius: isLongRange ? 0.5 : 2.5,
                    tension: 0.28,
                    spanGaps: true
                },
                {
                    label: '今早體重',
                    data: morningData,
                    borderColor: '#E5B3B3', // 莫蘭迪粉
                    backgroundColor: '#E5B3B3',
                    borderWidth: 2,
                    pointBackgroundColor: '#E5B3B3',
                    pointRadius: isLongRange ? 0.5 : 2.5,
                    tension: 0.28,
                    spanGaps: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: true, position: 'top', labels: { boxWidth: 6, font: { size: 10 }, color: '#7A726A' } } },
            scales: {
                y: { ticks: { font: { size: 9 }, color: '#A09696' }, grid: { color: 'rgba(110,101,101,0.04)' } },
                x: { ticks: { font: { size: 9 }, color: '#A09696', maxTicksLimit: 8 }, grid: { display: false } }
            }
        }
    });

    // B. 排空量長條圖
    const ctxDiff = document.getElementById('diffChart').getContext('2d');
    if (diffChart) diffChart.destroy();
    diffChart = new Chart(ctxDiff, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: diffData,
                backgroundColor: 'rgba(229, 179, 179, 0.5)',
                borderColor: '#E5B3B3',
                borderWidth: 1,
                borderRadius: 4,
                barPercentage: isLongRange ? 0.7 : 0.45
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { ticks: { font: { size: 9 }, color: '#A09696' }, grid: { color: 'rgba(110,101,101,0.03)' } },
                x: { ticks: { font: { size: 9 }, color: '#A09696', maxTicksLimit: 8 }, grid: { display: false } }
            }
        }
    });
}

// 10. 資料管理機制
function deleteLog(index) {
    if(confirm('確定要隱藏這筆精緻的恢復紀錄嗎？')) {
        appData.splice(index, 1);
        localStorage.setItem('weightDietLog', JSON.stringify(appData));
        updateDashboard();
    }
}

function exportData() {
    if(appData.length === 0) { alert('目前還沒有數據可以備份喔！'); return; }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appData));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `身體恢復日記備份_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.readAsText(file, 'UTF-8');
        reader.onload = readerEvent => {
            try {
                const content = JSON.parse(readerEvent.target.result);
                if (Array.isArray(content)) {
                    if(confirm('匯入將會安全合併現有數據，確定要繼續嗎？')) {
                        let mergedMap = new Map();
                        appData.forEach(item => mergedMap.set(item.date, item));
                        content.forEach(item => mergedMap.set(item.date, item));
                        appData = Array.from(mergedMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
                        localStorage.setItem('weightDietLog', JSON.stringify(appData));
                        updateDashboard();
                        alert('🎉 身體檔案還原成功！');
                    }
                } else { alert('格式不正確，這好像不是正確的日記檔案。'); }
            } catch (err) { alert('讀取失敗，請確認檔案。'); }
        }
    }
    input.click();
}