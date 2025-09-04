
// 创建Vue应用（关键修改：优化initPieView的响应式配置）
const { createApp, ref, reactive, watch, onMounted, nextTick, computed } = Vue;

createApp({
    setup() {
        // 状态管理（与原代码一致）
        const view = ref('cloud');
        const assets = ref([]);
        const isModalOpen = ref(false);
        const currentIndex = ref(-1);
        const modalTitle = ref('新增资产');
        const formData = reactive({
            name: '',
            percentage: 10,
            description: '',
            color: ''
        });
        const donutChartInstance = ref(null);
    const totalPercentage = ref();
    const totalAmount = ref(fund_data_list.all_money); // 单位：万，默认100万
    const currentPreset = ref('激进'); // 预设：稳健/保守/激进（默认激进）
    const yuji = reactive({ shouyi: 0, huiche: 0 }); // 预期收益/回撤（百分比）

        // 默认颜色与描述映射（从默认数据构建）
        const baseDefaultsMap = new Map();
        const buildDefaultsMapFrom = (list) => {
            baseDefaultsMap.clear();
            if (!Array.isArray(list)) return;
            list.forEach(it => {
                const key = (it?.name || '').trim();
                if (!key) return;
                baseDefaultsMap.set(key, { color: it?.color, description: it?.description });
            });
        };

        // 工具：按名称去重（保留首次出现，忽略后续重复项）
        const dedupeByName = (list) => {
            if (!Array.isArray(list)) return [];
            const map = new Map();
            for (const raw of list) {
                const key = (raw && raw.name ? String(raw.name) : '').trim();
                if (!key) continue; // 跳过空名称
                const pct = Number(raw?.percentage) || 0;
                if (map.has(key)) {
                    const exist = map.get(key);
                    exist.percentage = Math.max(0, (Number(exist.percentage) || 0) + pct);
                    // 若描述/颜色缺失，补全
                    if (!exist.description && raw?.description) exist.description = raw.description;
                    // 颜色保持首次为主
                } else {
                    map.set(key, {
                        name: key,
                        percentage: Math.max(0, pct),
                        description: raw?.description || '',
                        color: raw?.color || '#999999'
                    });
                }
            }
            return Array.from(map.values());
        };
 

    // 获取默认数据（支持对象结构与数组结构）
    const getDefaultData = () => {
        const src = Array.isArray(fund_data_list) ? fund_data_list : (fund_data_list?.list || []);
        return dedupeByName(src);
    }

        // 保存数据到本地存储（与原代码一致）
        const saveToLocalStorage = () => {
            try {
                localStorage.setItem('portfolioAssets', JSON.stringify(assets.value));
            } catch (e) {
                console.error('Failed to save data to localStorage:', e);
            }
        };

        // 切换视图（与原代码一致）
        const switchView = (newView) => {
            if (donutChartInstance.value) {
                donutChartInstance.value.destroy();
                donutChartInstance.value = null;
            }
            view.value = newView;
            nextTick().then(() => {
                if (newView === 'pie') {
                    initPieView();
                } else {
                    initCloudView();
                }
            });
        };

        // 打开模态框（与原代码一致）
        const openModal = (index) => {
            currentIndex.value = index;
            if (index === -1) {
                modalTitle.value = '新增资产';
                formData.name = '';
                formData.percentage = 10;
                formData.description = '';
                formData.color = getRandomColor();
            } else {
                modalTitle.value = '编辑资产';
                const item = assets.value[index];
                formData.name = item.name;
                formData.percentage = item.percentage;
                formData.description = item.description;
                formData.color = item.color;
            }
            isModalOpen.value = true;
        };

        // 关闭模态框（与原代码一致）
        const closeModal = () => {
            isModalOpen.value = false;
        };

        // 保存资产数据（与原代码一致）
        const saveAsset = () => {
            const nameKey = (formData.name || '').trim();
            if (!nameKey) {
                alert('资产名称不能为空');
                return;
            }
            // 名称唯一性校验：除当前编辑项外，不允许重名
            const dupIndex = assets.value.findIndex((a, i) => (a.name || '').trim() === nameKey && i !== currentIndex.value);
            if (dupIndex !== -1) {
                alert(`资产名称“${nameKey}”已存在，请使用不同名称`);
                return;
            }

            const newAsset = {
                name: nameKey,
                percentage: parseInt(formData.percentage),
                description: formData.description,
                color: formData.color
            };

            if (currentIndex.value === -1) {
                assets.value.push(newAsset);
            } else {
                assets.value[currentIndex.value] = newAsset;
            }

            // 二次去重保险（理论上不会触发）
            assets.value = dedupeByName(assets.value);

            saveToLocalStorage();
            closeModal();
            updateAllViews();
        };

        // 删除资产（与原代码一致）
        const deleteAsset = (index) => {
            if (confirm(`确定要删除 ${assets.value[index].name} 吗？`)) {
                assets.value.splice(index, 1);
                saveToLocalStorage();
                updateAllViews();
            }
        };

        // 生成随机颜色（与原代码一致）
        const getRandomColor = () => {
            const letters = '0123456789ABCDEF';
            let color = '#';
            for (let i = 0; i < 6; i++) {
                color += letters[Math.floor(Math.random() * 16)];
            }
            return color;
        };

        // 导出为 fund_data_list.js（包含 yuji + list），并清空本地缓存，刷新后从文件加载
        const exportData = () => {
            try {
                const list = dedupeByName(assets.value);
                const yShouyi = Number(yuji?.shouyi) || 0;
                const yHuiche = Number(yuji?.huiche) || 0;
                const lines = [];
                lines.push('var fund_data_list = {');
                lines.push('    yuji: {');
                lines.push(`        shouyi: ${yShouyi},//预计年化收益${yShouyi}%,`);
                lines.push(`        huiche: ${yHuiche},//预计回撤${yHuiche}%`);
                lines.push('    },');
                lines.push('    list: [');
                list.forEach((item, idx) => {
                    const name = String(item.name || '').replace(/"/g, '\\"');
                    const desc = String(item.description || '').replace(/"/g, '\\"');
                    const color = String(item.color || '#999999');
                    const pct = Number(item.percentage) || 0;
                    const comma = idx < list.length - 1 ? ',' : '';
                    lines.push(`        { name: "${name}", percentage: ${pct}, color: "${color}", description: "${desc}" }${comma}`);
                });
                lines.push('    ]');
                lines.push('}');
                const jsText = lines.join('\n');

                const blob = new Blob([jsText], { type: 'application/javascript' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'fund_data_list.js';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                // 清空本地存储，刷新后优先使用文件中的数据
                try { localStorage.removeItem('portfolioAssets'); } catch {}

                alert('已导出 fund_data_list.js 到浏览器下载目录。请将其覆盖到页面同目录后刷新，已清空本地缓存，刷新后将读取新文件。');
            } catch (e) {
                console.error('Failed to export data:', e);
                alert('导出数据失败，请重试');
            }
        };

        // 计算单项金额（单位：万）并格式化显示
        const assetAmount = (item) => {
            const pct = Number(item?.percentage) || 0;
            const base = Number(totalAmount.value) || 0;
            return (base * pct) / 100;
        };

        const formatAmount = (val) => {
            const n = Number(val) || 0;
            return n.toFixed(2);
        };

        // 预期收益/回撤金额（单位：万）
        const expectedReturnAmount = () => {
            const rate = Number(yuji?.shouyi) || 0; // 百分比
            const base = Number(totalAmount.value) || 0;
            return base * rate / 100;
        };
        const expectedDrawdownAmount = () => {
            const rate = Number(yuji?.huiche) || 0; // 百分比
            const base = Number(totalAmount.value) || 0;
            return base * rate / 100;
        };

        // 使用默认映射补全颜色与描述
        const enrichWithDefaults = (list) => {
            return (Array.isArray(list) ? list : []).map(raw => {
                const key = (raw?.name || '').trim();
                const base = baseDefaultsMap.get(key) || {};
                return {
                    name: key,
                    percentage: Number(raw?.percentage) || 0,
                    color: raw?.color || base.color || getRandomColor(),
                    description: raw?.description || base.description || ''
                };
            });
        };

        // 动态加载预设文件
        const loadPresetFile = (file) => new Promise((resolve, reject) => {
            try {
                // 移除旧的加载器脚本
                const old = document.getElementById('preset-loader');
                if (old && old.parentNode) old.parentNode.removeChild(old);
                const script = document.createElement('script');
                script.id = 'preset-loader';
                script.src = `${file}?t=${Date.now()}`; // 防缓存
        script.onload = () => {
                    try {
            // 支持对象结构（含 yuji/list）或纯数组
            const data = window.fund_data_list;
            resolve(data);
                    } catch (e) { reject(e); }
                };
                script.onerror = () => reject(new Error('脚本加载失败'));
                document.body.appendChild(script);
            } catch (e) {
                reject(e);
            }
        });

        const switchPreset = async (preset) => {
            currentPreset.value = preset;
            let file = 'fund_data_list.js';
            if (preset === '保守') file = 'fund_data_list_small.js';
            else if (preset === '激进') file = 'fund_data_list_big.js';
            else file = 'fund_data_list.js';

            try {
                const raw = await loadPresetFile(file);
                const rawList = Array.isArray(raw) ? raw : (raw?.list || []);
                if (raw && raw.yuji) {
                    yuji.shouyi = Number(raw.yuji.shouyi) || 0;
                    yuji.huiche = Number(raw.yuji.huiche) || 0;
                }
                const enriched = enrichWithDefaults(rawList);
                const deduped = dedupeByName(enriched);
                assets.value = deduped;
                updateAllViews();
            } catch (e) {
                console.error('切换预设失败:', e);
                alert(`无法加载预设文件：${file}`);
            }
        };

        // 初始化云图（更新：同名资产仅展示一个分块，不强制严格矩形，但以外接矩形呈现）
        const initCloudView = () => {
            const cloudContainer = document.querySelector('.cloud-container');
            if (!cloudContainer) return;

            cloudContainer.innerHTML = '';
            const gridSize = 10;
            const totalCells = gridSize * gridSize;
            const cells = Array(totalCells).fill(null);

            // 先放置大块，减少被分割概率
            const sortedAssets = dedupeByName(assets.value).sort((a, b) => b.percentage - a.percentage);

            sortedAssets.forEach(asset => {
                const cellCount = Math.round((asset.percentage / 100) * totalCells);
                placeAssetInGrid(asset, cellCount, cells, gridSize);
            });

            // 按连续区域渲染矩形块，避免外接矩形覆盖其他资产
            cells.forEach((asset, index) => {
                if (!asset) return;
                const row = Math.floor(index / gridSize);
                const col = index % gridSize;
                if (isAssetStart(index, asset, cells, gridSize)) {
                    const { width, height } = calculateAssetDimensions(index, asset, cells, gridSize);
                    const block = document.createElement('div');
                    block.className = 'cloud-item absolute transition-all duration-300';
                    block.style.left = `${col * 10}%`;
                    block.style.top = `${row * 10}%`;
                    block.style.width = `${width * 10}%`;
                    block.style.height = `${height * 10}%`;
                    block.style.backgroundColor = asset.color;
                    block.innerHTML = `
                        <div class="cloud-item-content">
                            <div class="text-sm sm:text-base">${asset.name}</div>
                            <div class="text-xs sm:text-sm opacity-90">${asset.percentage}%</div>
                        </div>
                    `;
                    block.title = `${asset.name}: ${asset.percentage}% - ${asset.description || ''}`;
                    cloudContainer.appendChild(block);
                }
            });
        };

        // 检查是否是资产块的起始位置（与原代码一致）
        const isAssetStart = (index, asset, cells, gridSize) => {
            const row = Math.floor(index / gridSize);
            const col = index % gridSize;
            const isTopEdge = row === 0 || cells[index - gridSize] !== asset;
            const isLeftEdge = col === 0 || cells[index - 1] !== asset;
            return isTopEdge && isLeftEdge;
        };

        // 计算资产块的宽度和高度（与原代码一致）
        const calculateAssetDimensions = (startIndex, asset, cells, gridSize) => {
            const startRow = Math.floor(startIndex / gridSize);
            const startCol = startIndex % gridSize;
            let width = 0;
            let height = 0;

            for (let col = startCol; col < gridSize; col++) {
                const index = startRow * gridSize + col;
                if (cells[index] === asset) {
                    width++;
                } else {
                    break;
                }
            }

            for (let row = startRow; row < gridSize; row++) {
                let hasAssetCell = false;
                for (let col = startCol; col < startCol + width; col++) {
                    const index = row * gridSize + col;
                    if (cells[index] === asset) {
                        hasAssetCell = true;
                        break;
                    }
                }
                if (hasAssetCell) {
                    height++;
                } else {
                    break;
                }
            }

            return { width, height };
        };

        // 将资产放置在网格中（与原代码一致）
        const placeAssetInGrid = (asset, cellCount, cells, gridSize) => {
            if (cellCount <= 0) return;

            const dimensions = findBestFitDimensions(cellCount);

            for (let row = 0; row <= gridSize - dimensions.height; row++) {
                for (let col = 0; col <= gridSize - dimensions.width; col++) {
                    if (isSpaceAvailable(row, col, dimensions.width, dimensions.height, cells, gridSize)) {
                        fillSpaceWithAsset(row, col, dimensions.width, dimensions.height, asset, cells, gridSize, cellCount);
                        return;
                    }
                }
            }

            fallbackPlacement(asset, cellCount, cells);
        };

    // 寻找最合适的矩形尺寸（尽量接近正方形）
        const findBestFitDimensions = (area) => {
            const width = Math.ceil(Math.sqrt(area));
            const height = Math.ceil(area / width);
            return { width, height };
        };

        // 检查空间是否可用（与原代码一致）
        const isSpaceAvailable = (row, col, width, height, cells, gridSize) => {
            for (let r = row; r < row + height; r++) {
                for (let c = col; c < col + width; c++) {
                    const index = r * gridSize + c;
                    if (cells[index] !== null) {
                        return false;
                    }
                }
            }
            return true;
        };

        // 在指定空间填充资产（与原代码一致）
        const fillSpaceWithAsset = (row, col, width, height, asset, cells, gridSize, maxCells) => {
            let cellsFilled = 0;
            for (let r = row; r < row + height && cellsFilled < maxCells; r++) {
                for (let c = col; c < col + width && cellsFilled < maxCells; c++) {
                    const index = r * gridSize + c;
                    cells[index] = asset;
                    cellsFilled++;
                }
            }
        };

        // fallback 放置方法：按行优先连续填充，保证“挨着排”
        const fallbackPlacement = (asset, cellCount, cells) => {
            if (cellCount <= 0) return;
            let placed = 0;
            const gridSize = 10; // 与容器一致
            for (let r = 0; r < gridSize && placed < cellCount; r++) {
                // 找到一段连续空位
                let c = 0;
                while (c < gridSize && placed < cellCount) {
                    // 跳过已占
                    while (c < gridSize && cells[r * gridSize + c] !== null) c++;
                    if (c >= gridSize) break;
                    // 开始连续段
                    const start = c;
                    while (c < gridSize && cells[r * gridSize + c] === null && placed < cellCount) {
                        cells[r * gridSize + c] = asset;
                        placed++;
                        c++;
                    }
                    // 下一段
                    c++;
                }
            }
        };

        // 初始化饼图（关键优化：确保响应式适配容器高度）
        const initPieView = () => {
            try {
                const ctx = document.getElementById('donutChart');
                if (!ctx) {
                    console.error('饼图Canvas元素未找到');
                    return;
                }

                donutChartInstance.value = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: assets.value.map(item => item.name),
                        datasets: [{
                            data: assets.value.map(item => item.percentage),
                            backgroundColor: assets.value.map(item => item.color),
                            borderWidth: 0,
                            hoverOffset: 10
                        }]
                    },
                    options: {
                        cutout: '70%', // 保持空心效果
                        responsive: true, // 关键：开启响应式，适配容器大小
                        maintainAspectRatio: true, // 关键：保持饼图宽高比（避免拉伸）
                        plugins: {
                            legend: {
                                position: 'right',
                                labels: {
                                    padding: 20,
                                    font: { size: 12 }
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function (context) {
                                        const item = assets.value[context.dataIndex];
                                        return `${item.name}: ${item.percentage}%`;
                                    },
                                    afterLabel: function (context) {
                                        const item = assets.value[context.dataIndex];
                                        return `说明: ${item.description}`;
                                    }
                                }
                            }
                        },
                        animation: {
                            animateScale: true,
                            animateRotate: true,
                            duration: 1000,
                            easing: 'easeOutQuart'
                        }
                    }
                });
            } catch (error) {
                console.error('初始化饼图失败:', error);
                alert('饼图加载失败，请重试');
                switchView('cloud');
            }
        };

        // 更新所有视图（与原代码一致）
        const updateAllViews = () => {
            totalPercentage.value = assets.value.reduce((sum, item) => sum + item.percentage, 0);

            if (view.value === 'cloud') {
                initCloudView();
            } else {
                if (donutChartInstance.value) {
                    donutChartInstance.value.destroy();
                }
                nextTick().then(initPieView);
            }
        };

        // 监听资产变化（与原代码一致）
        watch(assets, () => {
            updateAllViews();
        }, { deep: true });

        // 监听总金额，确保为非负数字
        watch(totalAmount, (v) => {
            const num = Number(v);
            if (!isFinite(num) || num < 0) {
                totalAmount.value = 0;
            }
        });

        // 窗口大小变化时重新适配（与原代码一致）
        const handleResize = () => {
            if (view.value === 'pie' && donutChartInstance.value) {
                donutChartInstance.value.resize(); // 关键：窗口缩放时重新适配容器
            }
        };

        const setInitialPieChartHeight = () => {
            const chartContainer = document.querySelector('.chart-container');
            let screenHeight = window.screen.height;
            if (chartContainer) {
                chartContainer.style.maxHeight = `${screenHeight * 0.6}px`;
            }
        };
        // 初始化页面（与原代码一致）
        onMounted(() => {
            // 设置初始饼图高度
            setInitialPieChartHeight();
            // 先用默认文件构建颜色/描述映射，供其它预设补齐
            try {
                const defList = Array.isArray(window.fund_data_list)
                    ? window.fund_data_list
                    : (window.fund_data_list?.list || []);
                buildDefaultsMapFrom(defList);
                // 读取默认的 yuji/总金额（若有），用于初始展示基准
                if (window.fund_data_list && window.fund_data_list.yuji) {
                    yuji.shouyi = Number(window.fund_data_list.yuji.shouyi) || 0;
                    yuji.huiche = Number(window.fund_data_list.yuji.huiche) || 0;
                }
                if (window.fund_data_list && typeof window.fund_data_list.all_money !== 'undefined') {
                    const am = Number(window.fund_data_list.all_money);
                    if (isFinite(am) && am >= 0) totalAmount.value = am;
                }
            } catch {}
            // 默认切换到激进策略
            switchPreset('激进');

            window.addEventListener('resize', handleResize);

            return () => {
                window.removeEventListener('resize', handleResize);
                if (donutChartInstance.value) {
                    donutChartInstance.value.destroy();
                }
            };
        });

        // 暴露给模板的变量和方法（与原代码一致）
        return {
            view,
            assets,
            tableAssets: computed(() => assets.value.filter(a => Number(a?.percentage) > 0)),
            isModalOpen,
            currentIndex,
            modalTitle,
            formData,
            totalPercentage,
            totalAmount,
            currentPreset,
            yuji,
            switchView,
            switchPreset,
            openModal,
            closeModal,
            saveAsset,
            deleteAsset,
            exportData,
            assetAmount,
            formatAmount,
            expectedReturnAmount,
            expectedDrawdownAmount
        };
    }
}).mount('#app');