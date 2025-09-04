// 健康导航数据
const healthNavData = {
    "🔬 专项检测": [
        { name: "血常规", url: "blood/routine.html", icon: "🩸" },
        { name: "生化检查", url: "blood/biochemistry.html", icon: "⚗️" },
        { name: "甲功三项", url: "thyroid/t3t4tsh.html", icon: "🏥" },
        { name: "甲状腺抗体", url: "thyroid/antibody.html", icon: "🔬" },
        { name: "食物过敏", url: "allergy/food.html", icon: "🍎" },
        { name: "环境过敏", url: "allergy/environment.html", icon: "🌿" }
    ],
    "🩺 体检报告": [
        { name: "全面体检", url: "check/physical.html", icon: "📋" },
        { name: "心电图", url: "check/ecg.html", icon: "❤️" },
        { name: "血压监测", url: "check/blood-pressure.html", icon: "📊" }
    ],
    "💡 医嘱建议": [
        { name: "生活建议", url: "#", icon: "📝", onclick: "scrollToMedicalAdvice('lifestyle')" },
        { name: "饮食指导", url: "#", icon: "🍎", onclick: "scrollToMedicalAdvice('diet')" },
        { name: "用药建议", url: "#", icon: "💊", onclick: "scrollToMedicalAdvice('medication')" },
        { name: "运动方案", url: "#", icon: "🏃", onclick: "scrollToMedicalAdvice('exercise')" }
    ]
};

// 页面加载完成后初始化导航
document.addEventListener('DOMContentLoaded', function() {
    // 等待数据加载完成后再初始化导航
    setTimeout(() => {
        initNavigation();
    }, 1000); // 给原数据加载一些时间
    
    // 点击外部关闭下拉菜单
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown')) {
            closeAllDropdowns();
        }
    });
});

// 初始化导航
function initNavigation() {
    const navContainer = document.getElementById('healthNav');
    const desktopNav = document.getElementById('desktopNav');
    const sidebarContent = document.getElementById('sidebarContent');
    if (!navContainer || !desktopNav || !sidebarContent) return;
    
    // 检查是否有全局数据可用
    if (typeof testsData === 'undefined' || typeof configData === 'undefined') {
        renderDefaultNavigation(desktopNav, sidebarContent);
        return;
    }
    
    // 使用实际数据渲染导航
    renderDataBasedNavigation(desktopNav, sidebarContent);
}

// 渲染基于实际数据的导航
function renderDataBasedNavigation(desktopNav, sidebarContent) {
    let navHTML = '';
    
    // 根据实际的测试数据生成导航
    const categories = {
        "🔬 专项检测": [],
        "🩺 体检报告": []
    };
    
    // 解析实际数据
    Object.keys(testsData).forEach(testType => {
        const testData = testsData[testType];
        const testConfig = configData.availableTests[testType];
        
        if (testData && testConfig) {
            const item = {
                name: testConfig.name || testType,
                url: `#test-${testType}`,
                icon: testConfig.icon || "📋",
                onclick: `smoothScrollToWithOffset('test-${testType}')`,
                testType: testType // 保存原始testType用于排序
            };
            
            // 根据测试类型分类：只有体检报告单独分类，其他都归入专项检测
            if (testType.includes('checkup')) {
                categories["🩺 体检报告"].push(item);
            } else {
                // 血液检查、甲状腺、过敏检测等都归入专项检测
                categories["🔬 专项检测"].push(item);
            }
        }
    });
    
    // 对体检报告按年份从新到旧排序
    categories["🩺 体检报告"].sort((a, b) => {
        // 提取年份进行比较，从testType中提取
        const getYear = (testType) => {
            const yearMatch = testType.match(/(\d{4})/);
            return yearMatch ? parseInt(yearMatch[1]) : 0;
        };
        
        const yearA = getYear(a.testType);
        const yearB = getYear(b.testType);
        
        // 按年份降序排列（新到旧）
        return yearB - yearA;
    });
    
    // 对专项检测按类型分组，然后在每组内按年份排序
    const specializedGroups = {};
    categories["🔬 专项检测"].forEach(item => {
        const baseType = item.testType.replace(/_\d{4}$/, '');
        if (!specializedGroups[baseType]) {
            specializedGroups[baseType] = [];
        }
        specializedGroups[baseType].push(item);
    });
    
    // 对每个分组内的项目按年份排序
    Object.keys(specializedGroups).forEach(baseType => {
        specializedGroups[baseType].sort((a, b) => {
            const getYear = (testType) => {
                const yearMatch = testType.match(/(\d{4})/);
                return yearMatch ? parseInt(yearMatch[1]) : 0;
            };
            
            const yearA = getYear(a.testType);
            const yearB = getYear(b.testType);
            
            return yearB - yearA; // 新到旧
        });
    });
    
    // 重新构建专项检测数组，保持类型分组
    categories["🔬 专项检测"] = [];
    Object.keys(specializedGroups).forEach(baseType => {
        categories["🔬 专项检测"].push(...specializedGroups[baseType]);
    });
    
    // 为体检报告的非最新项目设置特殊的onclick处理
    categories["🩺 体检报告"].forEach((item, index) => {
        if (index > 0) { // 非最新项目
            const baseType = item.testType.replace(/_\d{4}$/, '');
            item.onclick = `navigateToHistoryItem('${baseType}', '${item.testType}')`;
        }
    });
    
    // 为专项检测的非最新项目设置特殊的onclick处理
    // 需要重新按baseType分组来判断是否为最新项目
    const specializedGroupsForClick = {};
    categories["🔬 专项检测"].forEach(item => {
        const baseType = item.testType.replace(/_\d{4}$/, '');
        if (!specializedGroupsForClick[baseType]) {
            specializedGroupsForClick[baseType] = [];
        }
        specializedGroupsForClick[baseType].push(item);
    });
    
    // 为每个专项检测分组的非最新项目设置特殊onclick
    Object.keys(specializedGroupsForClick).forEach(baseType => {
        const group = specializedGroupsForClick[baseType];
        group.forEach((item, index) => {
            if (index > 0) { // 非最新项目
                item.onclick = `navigateToHistoryItem('${baseType}', '${item.testType}')`;
            }
        });
    });
    
    // 生成前两个下拉菜单
    Object.keys(categories).forEach(category => {
        const items = categories[category];
        if (items.length === 0) return; // 跳过空分类
        
        const categoryIcon = category.split(' ')[0];
        const categoryName = category.split(' ').slice(1).join(' ');
        
        navHTML += `
            <div class="dropdown">
                <button class="dropdown-btn" onclick="toggleDropdown(this)">
                    <span class="icon">${categoryIcon}</span>
                    <span>${categoryName}</span>
                    <span class="dropdown-arrow">▼</span>
                </button>
                <div class="dropdown-content">
                    ${items.map(item => `
                        <a href="#" class="dropdown-item" onclick="${item.onclick ? item.onclick + '; return false;' : 'return false;'}">
                            <span class="icon">${item.icon}</span>
                            <span>${item.name}</span>
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    // 添加医嘱建议菜单
    navHTML += `
        <div class="dropdown">
            <button class="dropdown-btn" onclick="toggleDropdown(this)">
                <span class="icon">💡</span>
                <span>医嘱建议</span>
                <span class="dropdown-arrow">▼</span>
            </button>
            <div class="dropdown-content">
                <a href="#" class="dropdown-item" onclick="scrollToMedicalAdvice('lifestyle'); return false;">
                    <span class="icon">📝</span>
                    <span>生活建议</span>
                </a>
                <a href="#" class="dropdown-item" onclick="scrollToMedicalAdvice('diet'); return false;">
                    <span class="icon">🍎</span>
                    <span>饮食指导</span>
                </a>
                <a href="#" class="dropdown-item" onclick="scrollToMedicalAdvice('medication'); return false;">
                    <span class="icon">💊</span>
                    <span>用药建议</span>
                </a>
                <a href="#" class="dropdown-item" onclick="scrollToMedicalAdvice('exercise'); return false;">
                    <span class="icon">🏃</span>
                    <span>运动方案</span>
                </a>
            </div>
        </div>
    `;
    
    // 添加右侧按钮
    navHTML += `
        <div class="nav-spacer"></div>
        <a href="../index.html" class="nav-back">返回首页</a>
        <div class="search-btn" onclick="toggleSearch()">🔍</div>
    `;
    
    // 设置桌面端导航
    desktopNav.innerHTML = navHTML;
    
    // 生成移动端侧边菜单
    generateMobileSidebar(sidebarContent, categories);
}

// 生成移动端侧边菜单
function generateMobileSidebar(sidebarContent, categories) {
    let sidebarHTML = '';
    
    // 生成专项检测和体检报告
    Object.keys(categories).forEach(category => {
        const items = categories[category];
        if (items.length === 0) return; // 跳过空分类
        
        const categoryIcon = category.split(' ')[0];
        const categoryName = category.split(' ').slice(1).join(' ');
        const sectionId = `section-${categoryName.replace(/\s+/g, '-')}`;
        
        sidebarHTML += `
            <div class="sidebar-section" id="${sectionId}">
                <div class="sidebar-section-title" onclick="toggleSidebarSection('${sectionId}')">
                    <span>${categoryIcon} ${categoryName}</span>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="sidebar-section-count">${items.length}</span>
                        <span class="sidebar-section-arrow">▼</span>
                    </div>
                </div>
                <div class="sidebar-section-content">
                    ${items.map(item => `
                        <a href="#" class="sidebar-item" onclick="${item.onclick || ''}; closeMobileSidebar(); return false;">
                            <span class="icon">${item.icon}</span>
                            <span>${item.name}</span>
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    // 添加医嘱建议
    const adviceItems = [
        { icon: "📝", name: "生活建议", onclick: "scrollToMedicalAdvice('lifestyle')" },
        { icon: "🍎", name: "饮食指导", onclick: "scrollToMedicalAdvice('diet')" },
        { icon: "💊", name: "用药建议", onclick: "scrollToMedicalAdvice('medication')" },
        { icon: "🏃", name: "运动方案", onclick: "scrollToMedicalAdvice('exercise')" }
    ];
    
    sidebarHTML += `
        <div class="sidebar-section" id="section-advice">
            <div class="sidebar-section-title" onclick="toggleSidebarSection('section-advice')">
                <span>💡 医嘱建议</span>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="sidebar-section-count">${adviceItems.length}</span>
                    <span class="sidebar-section-arrow">▼</span>
                </div>
            </div>
            <div class="sidebar-section-content">
                ${adviceItems.map(item => `
                    <a href="#" class="sidebar-item" onclick="${item.onclick ? item.onclick + '; closeMobileSidebar(); return false;' : 'closeMobileSidebar(); return false;'}">
                        <span class="icon">${item.icon}</span>
                        <span>${item.name}</span>
                    </a>
                `).join('')}
            </div>
        </div>
        <div class="sidebar-section" id="section-navigation">
            <div class="sidebar-section-title" onclick="toggleSidebarSection('section-navigation')">
                <span>🧭 页面导航</span>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="sidebar-section-count">2</span>
                    <span class="sidebar-section-arrow">▼</span>
                </div>
            </div>
            <div class="sidebar-section-content">
                <a href="../index.html" class="sidebar-item">
                    <span class="icon">🏠</span>
                    <span>返回首页</span>
                </a>
                <a href="#" class="sidebar-item" onclick="window.scrollTo({top: 0, behavior: 'smooth'}); closeMobileSidebar();">
                    <span class="icon">⬆️</span>
                    <span>回到顶部</span>
                </a>
            </div>
        </div>
    `;
    
    sidebarContent.innerHTML = sidebarHTML;
}

// 渲染默认导航（当数据未加载时）
function renderDefaultNavigation(desktopNav, sidebarContent) {
    let navHTML = '';
    
    // 遍历每个导航项
    Object.keys(healthNavData).forEach(category => {
        const items = healthNavData[category];
        const categoryIcon = category.split(' ')[0];
        const categoryName = category.split(' ').slice(1).join(' ');
        
        navHTML += `
            <div class="dropdown">
                <button class="dropdown-btn" onclick="toggleDropdown(this)">
                    <span class="icon">${categoryIcon}</span>
                    <span>${categoryName}</span>
                    <span class="dropdown-arrow">▼</span>
                </button>
                <div class="dropdown-content">
                    ${items.length > 0 ? 
                        items.map(item => `
                            <a href="${item.url}" class="dropdown-item" ${item.onclick ? `onclick="${item.onclick}"` : ''}>
                                <span class="icon">${item.icon}</span>
                                <span>${item.name}</span>
                            </a>
                        `).join('') : 
                        '<div class="dropdown-placeholder">暂无数据</div>'
                    }
                </div>
            </div>
        `;
    });
    
    // 添加右侧按钮
    navHTML += `
        <div class="nav-spacer"></div>
        <a href="../index.html" class="nav-back">返回首页</a>
        <div class="search-btn" onclick="toggleSearch()">🔍</div>
    `;
    
    // 设置桌面端导航
    desktopNav.innerHTML = navHTML;
    
    // 生成默认移动端侧边菜单
    generateDefaultMobileSidebar(sidebarContent);
}

// 生成默认移动端侧边菜单
function generateDefaultMobileSidebar(sidebarContent) {
    let sidebarHTML = '';
    
    // 遍历每个导航项
    Object.keys(healthNavData).forEach(category => {
        const items = healthNavData[category];
        const categoryIcon = category.split(' ')[0];
        const categoryName = category.split(' ').slice(1).join(' ');
        const sectionId = `section-${categoryName.replace(/\s+/g, '-')}`;
        
        sidebarHTML += `
            <div class="sidebar-section" id="${sectionId}">
                <div class="sidebar-section-title" onclick="toggleSidebarSection('${sectionId}')">
                    <span>${categoryIcon} ${categoryName}</span>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="sidebar-section-count">${items.length}</span>
                        <span class="sidebar-section-arrow">▼</span>
                    </div>
                </div>
                <div class="sidebar-section-content">
                    ${items.length > 0 ? 
                        items.map(item => `
                            <a href="${item.url}" class="sidebar-item" ${item.onclick ? `onclick="${item.onclick}; closeMobileSidebar();"` : 'onclick="closeMobileSidebar();"'}>
                                <span class="icon">${item.icon}</span>
                                <span>${item.name}</span>
                            </a>
                        `).join('') : 
                        '<div class="sidebar-placeholder">暂无数据</div>'
                    }
                </div>
            </div>
        `;
    });
    
    // 添加导航功能
    sidebarHTML += `
        <div class="sidebar-section" id="section-navigation">
            <div class="sidebar-section-title" onclick="toggleSidebarSection('section-navigation')">
                <span>🧭 页面导航</span>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="sidebar-section-count">2</span>
                    <span class="sidebar-section-arrow">▼</span>
                </div>
            </div>
            <div class="sidebar-section-content">
                <a href="../index.html" class="sidebar-item">
                    <span class="icon">🏠</span>
                    <span>返回首页</span>
                </a>
                <a href="#" class="sidebar-item" onclick="window.scrollTo({top: 0, behavior: 'smooth'}); closeMobileSidebar();">
                    <span class="icon">⬆️</span>
                    <span>回到顶部</span>
                </a>
            </div>
        </div>
    `;
    
    sidebarContent.innerHTML = sidebarHTML;
}

// 切换下拉菜单
function toggleDropdown(button) {
    const dropdown = button.closest('.dropdown');
    const isOpen = dropdown.classList.contains('show');
    
    // 关闭所有其他下拉菜单
    closeAllDropdowns();
    
    // 切换当前下拉菜单
    if (!isOpen) {
        dropdown.classList.add('show');
    }
}

// 关闭所有下拉菜单
function closeAllDropdowns() {
    document.querySelectorAll('.dropdown.show').forEach(dropdown => {
        dropdown.classList.remove('show');
    });
}

// 搜索功能（简化版）
function toggleSearch() {
    const searchTerm = prompt('请输入搜索关键词：');
    if (searchTerm) {
        alert(`搜索功能开发中...\n您搜索的是：${searchTerm}`);
    }
}

// 供外部调用的导航刷新函数
function refreshNavigation() {
    initNavigation();
}

// 导航到历史记录项目
function navigateToHistoryItem(baseType, targetTestType) {
    // 首先跳转到对应的测试卡片
    smoothScrollToWithOffset(`test-${baseType}`);
    
    // 等待滚动完成后展开历史记录
    setTimeout(() => {
        // 找到目标历史项目所在的年份
        const targetElement = document.getElementById(`history-item-${targetTestType}`);
        if (targetElement) {
            const year = targetElement.getAttribute('data-year');
            const yearContent = document.getElementById(`history-${baseType}-${year}`);
            const yearToggle = document.querySelector(`[onclick="toggleYearHistory('${baseType}', '${year}')"]`);
            
            if (yearContent && yearToggle) {
                // 如果年份历史记录没有展开，则展开它
                if (yearContent.style.display === 'none' || !yearContent.style.display) {
                    toggleYearHistory(baseType, year);
                }
                
                // 等待展开动画完成后跳转到具体的历史项目
                setTimeout(() => {
                    // 获取元素位置
                    const elementRect = targetElement.getBoundingClientRect();
                    const elementTop = elementRect.top + window.pageYOffset;
                    
                    // 计算目标位置：屏幕中间偏上（大约1/4处）
                    const viewportHeight = window.innerHeight;
                    const offset = viewportHeight * 0.25; // 屏幕高度的25%处，稍微偏上一点
                    const targetPosition = elementTop - offset;
                    
                    // 滚动到目标位置
                    window.scrollTo({
                        top: Math.max(0, targetPosition), // 确保不滚动到负数位置
                        behavior: 'smooth'
                    });
                    
                    // 高亮显示目标项目
                    targetElement.style.backgroundColor = 'rgba(255, 235, 59, 0.3)';
                    setTimeout(() => {
                        targetElement.style.backgroundColor = '';
                    }, 2000);
                }, 300); // 等待展开动画完成
            }
        }
    }, 500); // 等待滚动完成
}

// ==================== 移动端侧边菜单控制函数 ====================

// 打开移动端侧边菜单
function toggleMobileSidebar() {
    const sidebar = document.getElementById('mobileSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar && overlay) {
        sidebar.classList.add('open');
        overlay.classList.add('show');
        
        // 阻止背景滚动
        document.body.style.overflow = 'hidden';
        
        // 延迟恢复折叠状态，确保菜单已打开
        setTimeout(() => {
            restoreSidebarCollapsedState();
            // 智能展开相关分组
            autoExpandRelevantSections();
        }, 100);
    }
}

// 智能展开相关分组
function autoExpandRelevantSections() {
    // 检测当前页面内容，智能展开相关分组
    const hasTestContent = document.querySelector('#test-thyroid, #test-blood, #test-allergy');
    const hasRecommendations = document.querySelector('#recommendations');
    
    // 如果页面有测试内容，展开专项检测
    if (hasTestContent) {
        const specializedSection = document.getElementById('section-专项检测');
        if (specializedSection && specializedSection.classList.contains('collapsed')) {
            specializedSection.classList.remove('collapsed');
        }
    }
    
    // 如果页面有推荐内容，展开医嘱建议
    if (hasRecommendations) {
        const adviceSection = document.getElementById('section-advice');
        if (adviceSection && adviceSection.classList.contains('collapsed')) {
            adviceSection.classList.remove('collapsed');
        }
    }
}

// 关闭移动端侧边菜单
function closeMobileSidebar() {
    const sidebar = document.getElementById('mobileSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar && overlay) {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
        
        // 恢复背景滚动
        document.body.style.overflow = '';
    }
}

// 切换侧边菜单分组的折叠状态
function toggleSidebarSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.toggle('collapsed');
        
        // 可选：保存折叠状态到本地存储
        const collapsedSections = JSON.parse(localStorage.getItem('sidebarCollapsedSections') || '[]');
        const index = collapsedSections.indexOf(sectionId);
        
        if (section.classList.contains('collapsed')) {
            if (index === -1) collapsedSections.push(sectionId);
        } else {
            if (index > -1) collapsedSections.splice(index, 1);
        }
        
        localStorage.setItem('sidebarCollapsedSections', JSON.stringify(collapsedSections));
    }
}

// 恢复侧边菜单的折叠状态
function restoreSidebarCollapsedState() {
    const collapsedSections = JSON.parse(localStorage.getItem('sidebarCollapsedSections') || '[]');
    collapsedSections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add('collapsed');
        }
    });
}

// 处理侧边菜单的触摸事件（增强移动端体验）
document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('mobileSidebar');
    if (sidebar) {
        // 处理侧边菜单内部的滚动，防止传播到背景
        sidebar.addEventListener('touchmove', function(e) {
            e.stopPropagation();
        });
        
        // ESC键关闭侧边菜单
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeMobileSidebar();
            }
        });
        
        // 延迟恢复折叠状态，确保DOM已完全加载
        setTimeout(() => {
            restoreSidebarCollapsedState();
        }, 100);
    }
});

// 跳转到第一个检测项目
window.scrollToFirstTest = function() {
    // 查找第一个测试卡片
    const firstTestCard = document.querySelector('.eve-card[id^="test-"]');
    if (firstTestCard) {
        // 使用带偏移量的滚动函数
        const cardId = firstTestCard.getAttribute('id');
        if (cardId) {
            smoothScrollToWithOffset(cardId);
        } else {
            // 备用方案：使用原有的优化滚动函数
            if (typeof optimizedScrollToElement === 'function') {
                optimizedScrollToElement(firstTestCard);
            } else {
                firstTestCard.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start'
                });
            }
        }
    } else {
        // 如果没有找到测试卡片，跳转到recommendations
        if (typeof smoothScrollTo === 'function') {
            smoothScrollTo('recommendations');
        }
    }
}

// 带偏移量的滚动函数，避免导航栏遮挡
window.smoothScrollToWithOffset = function(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        // 获取导航栏高度
        const navHeight = document.querySelector('.health-nav')?.offsetHeight || 80;
        
        // 获取元素位置
        const elementRect = element.getBoundingClientRect();
        const elementTop = elementRect.top + window.pageYOffset;
        
        // 计算目标位置：让标题显示在屏幕中间稍微偏上的位置（大约1/3处）
        const viewportHeight = window.innerHeight;
        const targetOffset = viewportHeight * 0.13; // 屏幕高度的13%处，稍微偏上
        const targetPosition = elementTop - targetOffset;
        
        // 滚动到目标位置
        window.scrollTo({
            top: Math.max(0, targetPosition), // 确保不滚动到负数位置
            behavior: 'smooth'
        });
    }
}

// 滚动到医疗建议相关内容
window.scrollToMedicalAdvice = function(adviceType) {
    // 显示独立的医疗建议内容
    showIndependentMedicalAdvice(adviceType);
}

// 显示独立的医疗建议内容
window.showIndependentMedicalAdvice = function(adviceType) {
    if (!window.medicalAdvice || !window.medicalAdvice.advice) {
        alert('医疗建议数据加载失败，请刷新页面重试');
        return;
    }
    
    const adviceCard = document.getElementById('medicalAdviceCard');
    const adviceTitle = document.getElementById('adviceTitle');
    const adviceContent = document.getElementById('adviceContent');
    
    if (!adviceCard || !adviceTitle || !adviceContent) {
        console.error('医疗建议显示区域未找到');
        return;
    }
    
    const section = window.medicalAdvice.advice[adviceType];
    if (!section) {
        console.error('找不到指定的医疗建议类型:', adviceType);
        return;
    }
    
    // 设置标题
    adviceTitle.innerHTML = `${section.icon} ${section.title}`;
    
    // 生成内容
    let content = '';
    if (section.sections && section.sections.length > 0) {
        section.sections.forEach(item => {
            content += `<div class="advice-section" style="margin-bottom: 20px; padding: 15px; background: rgba(${section.color ? hexToRgb(section.color) : '116, 185, 255'}, 0.1); border-left: 4px solid ${section.color || '#74b9ff'}; border-radius: 8px;">
                <h4 style="color: ${section.color || '#74b9ff'}; margin-bottom: 10px; font-size: 16px;">
                    ${item.category}
                </h4>
                <p style="margin-bottom: 10px; line-height: 1.6;">
                    ${item.content}
                </p>`;
            
            if (item.details && item.details.length > 0) {
                content += `<ul style="margin: 10px 0; padding-left: 20px; line-height: 1.6;">`;
                item.details.forEach(detail => {
                    content += `<li style="margin-bottom: 5px;">${detail}</li>`;
                });
                content += `</ul>`;
            }
            
            content += `</div>`;
        });
    }
    
    // 设置内容
    adviceContent.innerHTML = content;
    
    // 显示建议卡片
    adviceCard.style.display = 'block';
    
    // 滚动到建议卡片，使用带偏移量的滚动避免导航栏遮挡
    setTimeout(() => {
        smoothScrollToWithOffset('medicalAdviceCard');
    }, 100);
}

// 从总览区域点击时显示医疗建议（带滚动优化）
window.showIndependentMedicalAdviceWithScroll = function(adviceType) {
    // 首先显示医疗建议
    showIndependentMedicalAdvice(adviceType);
}

// 隐藏医疗建议
window.hideMedicalAdvice = function() {
    const adviceCard = document.getElementById('medicalAdviceCard');
    if (adviceCard) {
        adviceCard.style.display = 'none';
    }
}

// 辅助函数：将十六进制颜色转换为RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
        '116, 185, 255';
}

// 高亮显示相关的医疗建议内容
function highlightMedicalAdvice(adviceType) {
    // 移除之前的高亮
    document.querySelectorAll('.advice-highlight').forEach(el => {
        el.classList.remove('advice-highlight');
    });
    
    let targetElements = [];
    
    switch(adviceType) {
        case 'lifestyle':
            // 查找生活建议相关的内容（📝图标）
            targetElements = Array.from(document.querySelectorAll('.eve-note-item')).filter(el => 
                el.textContent.includes('📝') || el.textContent.includes('生活方式') || 
                el.textContent.includes('作息') || el.textContent.includes('规律')
            );
            break;
        case 'diet':
            // 查找饮食指导相关的内容（🍎图标）
            targetElements = Array.from(document.querySelectorAll('.eve-note-item')).filter(el => 
                el.textContent.includes('🍎') || el.textContent.includes('饮食') || 
                el.textContent.includes('营养') || el.textContent.includes('食物')
            );
            break;
        case 'medication':
            // 查找用药建议相关的内容（💊图标）
            targetElements = Array.from(document.querySelectorAll('.eve-note-item')).filter(el => 
                el.textContent.includes('💊') || el.textContent.includes('用药') || 
                el.textContent.includes('药物') || el.textContent.includes('治疗')
            );
            break;
        case 'exercise':
            // 查找运动方案相关的内容（🏃图标）
            targetElements = Array.from(document.querySelectorAll('.eve-note-item')).filter(el => 
                el.textContent.includes('🏃') || el.textContent.includes('运动') || 
                el.textContent.includes('锻炼') || el.textContent.includes('健身')
            );
            break;
    }
    
    // 添加高亮效果
    targetElements.forEach(el => {
        el.classList.add('advice-highlight');
        setTimeout(() => {
            el.classList.remove('advice-highlight');
        }, 3000); // 3秒后移除高亮
    });
}
