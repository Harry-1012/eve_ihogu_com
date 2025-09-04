// 存储数据的全局变量
let configData = {};
let testsData = {};
let medicalAdvice = {};

// 将 medicalAdvice 设为全局变量，供 navigation.js 使用
window.medicalAdvice = medicalAdvice;

// 加载JSON数据
async function loadData() {
    try {
        // 首先加载配置文件
        const configResponse = await fetch('./data/config.json');
        if (!configResponse.ok) {
            throw new Error(`配置文件加载失败: ${configResponse.status}`);
        }
        configData = await configResponse.json();

        // 验证配置数据
        if (!configData.activeTests || !Array.isArray(configData.activeTests)) {
            throw new Error('配置文件中缺少activeTests数组');
        }
        if (!configData.availableTests || typeof configData.availableTests !== 'object') {
            throw new Error('配置文件中缺少availableTests对象');
        }

        // 根据配置加载活跃的检测数据
        const loadPromises = configData.activeTests.map(async testType => {
            try {
                const testConfig = configData.availableTests[testType];
                if (!testConfig || !testConfig.dataFile) {
                    return;
                }

                const response = await fetch(`./data/${testConfig.dataFile}`);
                if (!response.ok) {
                    return;
                }

                const data = await response.json();
                testsData[testType] = data;
            } catch (error) {
                // 静默处理错误，继续加载其他数据
            }
        });

        await Promise.all(loadPromises);

        // 加载医疗建议数据
        try {
            const adviceResponse = await fetch('./data/recomm/medical_advice.json');
            if (adviceResponse.ok) {
                medicalAdvice = await adviceResponse.json();
                window.medicalAdvice = medicalAdvice; // 更新全局变量
            } else {
                console.error('医疗建议数据加载失败:', adviceResponse.status);
            }
        } catch (error) {
            console.error('医疗建议数据加载错误:', error);
        }

        // 检查是否至少加载了一个检测数据
        if (Object.keys(testsData).length === 0) {
            throw new Error('没有成功加载任何检测数据');
        }

        // 数据加载完成后渲染页面
        renderPage();
        
        // 渲染医疗建议总览
        renderMedicalAdviceOverview();
        
        // 刷新导航（使用新的navigation.js）
        if (typeof refreshNavigation === 'function') {
            refreshNavigation();
        }
    } catch (error) {
        // 如果加载失败，显示错误信息
        document.querySelector('.eve-container').innerHTML = `
            <div class="eve-card">
                <h2 style="color: #e74c3c; text-align: center;">⚠️ 数据加载失败</h2>
                <p style="text-align: center;">错误信息: ${error.message}</p>
                <p style="text-align: center;">请检查数据文件是否存在或网络连接</p>
                <div style="text-align: center; margin-top: 20px;">
                    <button onclick="location.reload()" class="eve-button">重新加载</button>
                </div>
            </div>
        `;
    }
}

// 渲染页面内容
function renderPage() {
    renderHeader();
    renderTestSections();
    renderChart();
}

// 渲染页面头部
function renderHeader() {
    try {
        const headerMetaDiv = document.querySelector('.header-meta');
        if (!headerMetaDiv) {
            return;
        }

        const patientInfo = configData.patientInfo || {};
        headerMetaDiv.innerHTML = `
            <span>🗓️ 最后更新: ${patientInfo.lastUpdate || '未知'}</span>
            <span>📍 检验机构: ${patientInfo.institution || '未知'}</span>
            <span>👩‍⚕️ 主治医师: ${patientInfo.doctors || '未知'}</span>
        `;
    } catch (error) {
        // 静默处理错误
    }
}

// 平滑滚动到指定元素
function smoothScrollTo(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        optimizedScrollToElement(element);
    }
}

// 优化的滚动函数 - 滚动到屏幕中间偏上位置
function optimizedScrollToElement(element) {
    // 获取元素位置
    const elementRect = element.getBoundingClientRect();
    const elementTop = elementRect.top + window.pageYOffset;
    
    // 计算目标位置：屏幕中间偏上（大约1/3处）
    const viewportHeight = window.innerHeight;
    const offset = viewportHeight * 0.33; 
    const targetPosition = elementTop - offset;
    
    // 滚动到目标位置
    window.scrollTo({
        top: Math.max(0, targetPosition), // 确保不滚动到负数位置
        behavior: 'smooth'
    });
}

// 搜索功能
let searchExpanded = false;

function toggleSearch() {
    const container = document.getElementById('searchInputContainer');
    const input = document.getElementById('searchInput');
    
    if (!searchExpanded) {
        container.classList.add('active');
        setTimeout(() => input.focus(), 300);
        searchExpanded = true;
    } else {
        container.classList.remove('active');
        clearSearch();
        searchExpanded = false;
    }
}

function performSearch() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const testCards = document.querySelectorAll('.eve-card[id^="test-"]');
    if (!query) {
        testCards.forEach(card => {
            card.classList.remove('search-hidden');
            removeHighlight(card);
        });
        return;
    }
    testCards.forEach(card => {
        // 搜索卡片内所有可见文本内容
        const text = card.innerText.toLowerCase();
        if (text.includes(query)) {
            card.classList.remove('search-hidden');
            highlightAllText(card, query);
        } else {
            card.classList.add('search-hidden');
            removeHighlight(card);
        }
    });
}

// 高亮卡片内所有匹配内容
function highlightAllText(card, query) {
    removeHighlight(card);
    if (!query) return;
    // 只高亮常见内容区域，避免破坏结构
    const elements = card.querySelectorAll('h2, h3, h4, td, th, div, span, li, p');
    elements.forEach(el => {
        if (el.children.length === 0 && el.textContent.toLowerCase().includes(query)) {
            el.innerHTML = el.textContent.replace(new RegExp(`(${query})`, 'gi'), '<span class="search-highlight">$1</span>');
        }
    });
}

function highlightText(card, originalText, query) {
    // 找到卡片中的诊断标题并高亮搜索词
    const titleElements = card.querySelectorAll('h2, .diagnosis-title, .allergy-title, .blood-title');
    titleElements.forEach(element => {
        if (element.textContent.includes(originalText)) {
            const highlightedText = originalText.replace(
                new RegExp(`(${query})`, 'gi'),
                '<span class="search-highlight">$1</span>'
            );
            element.innerHTML = element.innerHTML.replace(originalText, highlightedText);
        }
    });
}

function removeHighlight(card) {
    const highlights = card.querySelectorAll('.search-highlight');
    highlights.forEach(highlight => {
        const parent = highlight.parentNode;
        parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
        parent.normalize();
    });
}

function clearSearch() {
    const input = document.getElementById('searchInput');
    input.value = '';
    performSearch(); // 清除搜索结果
}

function handleSearchKeyup(event) {
    if (event.key === 'Escape') {
        toggleSearch();
    }
}

// 点击页面其他地方关闭搜索
document.addEventListener('click', function(event) {
    const searchContainer = event.target.closest('.search-container');
    if (!searchContainer && searchExpanded) {
        toggleSearch();
    }
});

// 渲染所有检测部分
function renderTestSections() {
    try {
        // 按检测类型分组，每组按年份排序
        const testGroups = {};
        
        configData.activeTests.forEach(testType => {
            const testData = testsData[testType];
            if (!testData) return;
            
            // 提取检测基础类型（去掉年份）
            const baseType = testType.replace(/_\d{4}$/, '');
            
            if (!testGroups[baseType]) {
                testGroups[baseType] = [];
            }
            
            testGroups[baseType].push({
                testType,
                testData,
                year: extractYear(testType),
                sort: testData.diagnosis?.sort || 0
            });
        });
        
        // 对每组内的测试按年份排序（新到旧）
        Object.keys(testGroups).forEach(baseType => {
            testGroups[baseType].sort((a, b) => b.year - a.year);
        });
        
        // 按sort值排序组
        const sortedGroups = Object.keys(testGroups).sort((a, b) => {
            const sortA = testGroups[a][0]?.sort || 0;
            const sortB = testGroups[b][0]?.sort || 0;
            return sortB - sortA;
        });

        // 获取容器中的卡片，跳过第一个（标题）和后两个（图表和建议）
        const container = document.querySelector('.eve-container');
        if (!container) {
            return;
        }
        
        const cards = container.querySelectorAll('.eve-card');
        
        // 移除现有的检测卡片（保留标题、图表和建议卡片）
        for (let i = cards.length - 1; i >= 1; i--) {
            if (i < cards.length - 2) { // 不删除最后两个卡片
                cards[i].remove();
            }
        }

        // 在标题卡片后插入新的检测卡片
        const titleCard = cards[0];
        let lastInsertedCard = titleCard;
        
        sortedGroups.forEach((baseType) => {
            const group = testGroups[baseType];
            if (group.length === 0) return;
            
            // 渲染最新的检测结果
            const latest = group[0];
            const testCard = document.createElement('div');
            testCard.className = 'eve-card';
            testCard.id = `test-${latest.testType}`;
            testCard.innerHTML = renderTestCard(latest.testData, latest.testType);
            
            // 如果有历史记录，添加历史记录切换按钮
            if (group.length > 1) {
                addHistoryToggle(testCard, group, baseType);
            }
            
            lastInsertedCard.insertAdjacentElement('afterend', testCard);
            lastInsertedCard = testCard;
        });
    } catch (error) {
        // 静默处理错误
    }
}

// 提取年份的辅助函数
function extractYear(testType) {
    const yearMatch = testType.match(/(\d{4})/);
    return yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
}

// 添加历史记录切换功能
function addHistoryToggle(testCard, group, baseType) {
    const latest = group[0];
    const historyItems = group.slice(1);
    
    // 按年份分组历史记录
    const yearGroups = {};
    historyItems.forEach(item => {
        const year = item.year;
        if (!yearGroups[year]) {
            yearGroups[year] = [];
        }
        yearGroups[year].push(item);
    });
    
    // 在卡片末尾添加历史记录按钮和容器
    const historySection = document.createElement('div');
    historySection.className = 'history-section';
    
    // 生成按年份分组的历史记录HTML
    let yearGroupsHTML = '';
    Object.keys(yearGroups).sort((a, b) => b - a).forEach(year => { // 年份从新到旧排序
        const yearItems = yearGroups[year];
        yearGroupsHTML += `
            <div class="year-group">
                <div class="year-toggle" onclick="toggleYearHistory('${baseType}', '${year}')">
                    <span class="history-icon">📋</span>
                    <span class="history-text">查看历史记录 (${year})</span>
                    <span class="history-arrow">▼</span>
                </div>
                <div class="year-content" id="history-${baseType}-${year}" style="display: none;">
                    ${yearItems.map(item => `
                        <div class="history-item" id="history-item-${item.testType}" data-year="${item.year}">
                            <div class="history-card-content">
                                ${renderTestCard(item.testData, item.testType)}
                            </div>
                        </div>
                    `).join('')}
                    <div class="history-collapse" onclick="toggleYearHistory('${baseType}', '${year}')">
                        <span class="collapse-icon">📋</span>
                        <span class="collapse-text">折叠${year}年记录</span>
                        <span class="collapse-arrow">▲</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    historySection.innerHTML = `
        <div class="history-header">
            <div class="history-summary">
                <span class="history-icon">📋</span>
                <span>历史记录 (共${historyItems.length}条，${Object.keys(yearGroups).length}个年份)</span>
            </div>
        </div>
        <div class="history-years-container">
            ${yearGroupsHTML}
        </div>
    `;
    
    testCard.appendChild(historySection);
}

// 切换历史记录显示/隐藏
function toggleHistory(baseType) {
    const historyContent = document.getElementById(`history-${baseType}`);
    const historyToggle = document.querySelector(`[onclick="toggleHistory('${baseType}')"]`);
    const arrow = historyToggle.querySelector('.history-arrow');
    
    if (historyContent.style.display === 'none') {
        historyContent.style.display = 'block';
        arrow.textContent = '▲';
        historyToggle.querySelector('.history-text').textContent = 
            historyToggle.querySelector('.history-text').textContent.replace('查看', '隐藏');
    } else {
        historyContent.style.display = 'none';
        arrow.textContent = '▼';
        historyToggle.querySelector('.history-text').textContent = 
            historyToggle.querySelector('.history-text').textContent.replace('隐藏', '查看');
    }
}

// 切换年份历史记录显示/隐藏
function toggleYearHistory(baseType, year) {
    const yearContent = document.getElementById(`history-${baseType}-${year}`);
    const yearToggle = document.querySelector(`[onclick="toggleYearHistory('${baseType}', '${year}')"]`);
    const arrow = yearToggle.querySelector('.history-arrow');
    
    if (yearContent.style.display === 'none') {
        yearContent.style.display = 'block';
        arrow.textContent = '▲';
        yearToggle.querySelector('.history-text').textContent = 
            yearToggle.querySelector('.history-text').textContent.replace('查看', '隐藏');
    } else {
        yearContent.style.display = 'none';
        arrow.textContent = '▼';
        yearToggle.querySelector('.history-text').textContent = 
            yearToggle.querySelector('.history-text').textContent.replace('隐藏', '查看');
    }
}

// 渲染单个检测卡片
function renderTestCard(testData, testType) {
    try {
        if (!testData || !testData.diagnosis) {
            return `<div class="eve-note-item">⚠️ ${testType} 数据格式错误</div>`;
        }

        let content = `<h2 style="color: ${testData.diagnosis.color || '#666'}; font-size: 24px; font-weight: 600; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 28px;">${testData.diagnosis.icon || '📋'}</span> ${testData.diagnosis.name || testType}
        </h2>`;

        // 检测信息
        if (testData.testInfo) {
            content += `<div class="eve-info-box">
                <div class="test-date">🔬 检验时间：${testData.testInfo.date || '未知'} ${testData.testInfo.time || ''} (${testData.testInfo.method || '未知'})</div>
            </div>`;
        }

        // 特殊处理血信息
        if (testData.donationInfo) {
            content += `<div class="eve-info-box" style="background: linear-gradient(45deg, rgba(231, 76, 60, 0.1), rgba(192, 57, 43, 0.1)); border-left-color: #e74c3c;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                    <div><strong>🩸 血量：</strong> ${testData.donationInfo.volume || '未知'}</div>
                    <div><strong>✅ 筛查结果：</strong> ${testData.donationInfo.status || '未知'}</div>
                    <div><strong>🔴 血型：</strong> ${testData.donationInfo.bloodType || '未知'}</div>
                    <div><strong>➕ Rh因子：</strong> ${testData.donationInfo.rhType || '未知'}</div>
                </div>
            </div>`;
        }

        // 检测结果表格
        if (testData.results && Array.isArray(testData.results) && testData.results.length > 0) {
            if (testType === 'allergy') {
                content += renderAllergyTable(testData);
            } else {
                content += renderStandardTable(testData);
            }
        }

        // 用药信息（仅过敏检测）
        if (testData.medications && Array.isArray(testData.medications)) {
            content += `<div style="margin-top: 20px;">
                <h4 style="color: ${testData.diagnosis.color || '#666'}; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                    <span>💊</span> 当前用药方案
                </h4>`;
            
            testData.medications.forEach(med => {
                content += `<div class="medication-item">
                    <div>
                        <strong>${med.name || '未知药物'}</strong> - ${med.dosage || ''}，${med.timing || ''}
                        <br><span style="color: #666; font-size: 14px;">${med.indication || ''}</span>
                    </div>
                </div>`;
            });
            
            content += `</div>`;
        }

        // 添加医生建议与注意事项
        if (testData.recommendations) {
            content += renderTestRecommendations(testData, testType);
        }

        return content;
    } catch (error) {
        return `<div class="eve-note-item">⚠️ ${testType} 渲染失败</div>`;
    }
}

// 渲染单个检测的建议内容
function renderTestRecommendations(testData, testType) {
    let content = `<div style="margin-top: 25px; border-top: 2px solid rgba(${testData.diagnosis.color ? testData.diagnosis.color.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16)).join(', ') : '102, 102, 102'}, 0.2); padding-top: 20px;">
        <h4 style="color: ${testData.diagnosis.color || '#666'}; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
            <span>🩺</span> 医生建议与注意事项
        </h4>`;

    // 诊断说明
    if (testData.recommendations.diagnosis) {
        content += `<div class="eve-note-item">
            <strong>🩺 诊断说明：</strong> ${testData.recommendations.diagnosis}
        </div>`;
    }

    // 治疗方案
    if (testData.recommendations.treatment) {
        content += `<div class="eve-note-item">
            <strong>💊 治疗方案：</strong> ${testData.recommendations.treatment}
        </div>`;
    }

    // 生活建议
    if (testData.recommendations.lifestyle && Array.isArray(testData.recommendations.lifestyle) && testData.recommendations.lifestyle.length > 0) {
        content += `<div class="eve-note-item">
            <strong>🥗 生活建议：</strong> 
            <ul style="margin: 10px 0; padding-left: 20px;">`;

        testData.recommendations.lifestyle.forEach(item => {
            content += `<li>${item}</li>`;
        });

        content += `</ul>
        </div>`;
    }

    // 过敏检测的特殊建议
    if (testType === 'allergy') {
        if (testData.recommendations.seasonalProtection) {
            content += `<div class="eve-note-item">
                <strong>🌸 过敏季节防护：</strong> ${testData.recommendations.seasonalProtection}
            </div>`;
        }

        if (testData.recommendations.medicationGuidance) {
            content += `<div class="eve-note-item">
                <strong>💊 用药指导：</strong> ${testData.recommendations.medicationGuidance}
            </div>`;
        }

        if (testData.recommendations.environmentalManagement && Array.isArray(testData.recommendations.environmentalManagement)) {
            content += `<div class="eve-note-item">
                <strong>🏡 环境管理：</strong> 
                <ul style="margin: 10px 0; padding-left: 20px;">`;

            testData.recommendations.environmentalManagement.forEach(item => {
                content += `<li>${item}</li>`;
            });

            content += `</ul>
            </div>`;
        }

        if (testData.recommendations.symptoms) {
            content += `<div class="eve-note-item">
                <strong>⚠️ 注意症状：</strong> ${testData.recommendations.symptoms}
            </div>`;
        }
    }

    // 血液检测的特殊建议
    if (testType === 'blood' && testData.recommendations.donationNotes) {
        content += `<div class="eve-note-item" style="background: rgba(231, 76, 60, 0.1); border-left-color: #e74c3c;">
            <strong>🩸 血液检测提醒：</strong> ${testData.recommendations.donationNotes}
        </div>`;
    }

    // 复查建议
    if (testData.recommendations.followUp) {
        content += `<div class="eve-note-item" style="background: rgba(116, 185, 255, 0.1); border-left-color: #74b9ff;">
            <strong>🔄 复查建议：</strong> ${testData.recommendations.followUp}
        </div>`;
    }

    // 添加通用医疗建议
    content += renderGeneralMedicalAdvice(testType);

    content += `</div>`;
    return content;
}

// 渲染通用医疗建议
function renderGeneralMedicalAdvice(testType) {
    if (!medicalAdvice || !medicalAdvice.advice) {
        return '';
    }

    let content = '';
    
    // 根据测试类型映射相关的建议类型
    const testTypeMapping = {
        'allergy': ['lifestyle', 'diet'],
        'thyroid': ['lifestyle', 'diet', 'medication'],
        'thyroid_history': ['lifestyle', 'diet'],
        'blood': ['lifestyle', 'diet', 'exercise'],
        'checkup_2020': ['lifestyle', 'exercise'],
        'checkup_2021': ['lifestyle', 'exercise'],
        'liver': ['lifestyle', 'diet'],
        'kidney': ['lifestyle', 'diet', 'exercise']
    };

    const relevantSections = testTypeMapping[testType] || ['lifestyle'];
    
    relevantSections.forEach(sectionKey => {
        const section = medicalAdvice.advice[sectionKey];
        
        if (section && section.sections && section.sections.length > 0) {
            content += `<div class="eve-note-item" style="background: rgba(52, 152, 219, 0.1); border-left-color: #3498db;">
                <strong>${section.icon} ${section.title}：</strong>
                <div style="margin: 10px 0;">`;
            
            section.sections.forEach(item => {
                content += `<div style="margin-bottom: 10px;">
                    <strong>${item.category}：</strong>${item.content}`;
                
                if (item.details && item.details.length > 0) {
                    content += `<ul style="margin: 5px 0; padding-left: 20px;">`;
                    item.details.forEach(detail => {
                        content += `<li>${detail}</li>`;
                    });
                    content += `</ul>`;
                }
                
                content += `</div>`;
            });
            
            content += `</div></div>`;
        }
    });

    return content;
}

// 渲染医疗建议总览
function renderMedicalAdviceOverview() {
    const overviewContainer = document.getElementById('overviewContent');
    if (!overviewContainer) {
        return;
    }

    if (!medicalAdvice || !medicalAdvice.advice) {
        overviewContainer.innerHTML = `
            <div class="eve-note-item" style="text-align: center; color: #666;">
                <p>医疗建议数据加载中...</p>
            </div>
        `;
        return;
    }

    let content = '';
    
    // 渲染四个主要建议板块
    const adviceTypes = [
        { key: 'lifestyle', title: '生活建议', icon: '📝', color: '#74b9ff' },
        { key: 'diet', title: '饮食指导', icon: '🍎', color: '#00b894' },
        { key: 'medication', title: '用药建议', icon: '💊', color: '#e17055' },
        { key: 'exercise', title: '运动方案', icon: '🏃', color: '#fd79a8' }
    ];

    content += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px;">`;
    
    adviceTypes.forEach(type => {
        const section = medicalAdvice.advice[type.key];
        if (section && section.sections) {
            content += `
                <div class="advice-overview-card" style="
                    background: linear-gradient(135deg, ${type.color}15, ${type.color}08);
                    border: 1px solid ${type.color}30;
                    border-radius: 12px;
                    padding: 20px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    position: relative;
                " onclick="showIndependentMedicalAdviceWithScroll('${type.key}')" 
                   onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.15)'"
                   onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                    
                    <h3 style="color: ${type.color}; font-size: 18px; margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 24px;">${type.icon}</span>
                        ${type.title}
                        <span style="margin-left: auto; font-size: 14px; opacity: 0.7;">点击查看详情</span>
                    </h3>
                    
                    <div style="color: #666; line-height: 1.6;">`;
            
            // 显示前2个分类的摘要
            section.sections.slice(0, 2).forEach(item => {
                content += `
                    <div style="margin-bottom: 10px;">
                        <strong style="color: ${type.color};">${item.category}：</strong>
                        <span>${item.content.length > 60 ? item.content.substring(0, 60) + '...' : item.content}</span>
                    </div>
                `;
            });
            
            if (section.sections.length > 2) {
                content += `<div style="color: ${type.color}; font-size: 14px; margin-top: 10px;">还有 ${section.sections.length - 2} 项建议...</div>`;
            }
            
            content += `
                    </div>
                </div>
            `;
        }
    });
    
    content += `</div>`;

    // 添加关键要点总结
    if (medicalAdvice.summary && medicalAdvice.summary.keyPoints) {
        content += `
            <div style="background: linear-gradient(135deg, #74b9ff15, #74b9ff08); border: 1px solid #74b9ff30; border-radius: 12px; padding: 20px; margin-top: 20px;">
                <h3 style="color: #74b9ff; font-size: 18px; margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 24px;">🎯</span>
                    关键要点总结
                </h3>
                <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
        `;
        
        medicalAdvice.summary.keyPoints.forEach(point => {
            content += `<li style="margin-bottom: 8px; color: #666;">${point}</li>`;
        });
        
        content += `
                </ul>
            </div>
        `;
    }

    overviewContainer.innerHTML = content;
}

// 渲染过敏检测表格
function renderAllergyTable(testData) {
    let tableContent = `<table class="eve-table">
        <thead>
            <tr>
                <th>过敏原类别</th>
                <th>具体过敏原</th>
                <th>敏感度等级</th>
                <th>IgE值 (kU/L)</th>
                <th>季节性</th>
            </tr>
        </thead>
        <tbody>`;

    testData.results.forEach(result => {
        tableContent += `<tr>
            <td>${result.category}</td>
            <td>${result.allergen}</td>
            <td class="${result.isAllergic ? 'eve-status-abnormal' : 'eve-status-normal'}">${result.sensitivity}</td>
            <td class="${result.isAllergic ? 'eve-status-abnormal' : 'eve-status-normal'}">${result.igeValue}</td>
            <td>${result.season}</td>
        </tr>`;
    });

    tableContent += `</tbody></table>`;
    return tableContent;
}

// 渲染标准检测表格
function renderStandardTable(testData) {
    // 检查是否是体检类型数据，如果是则按类别分组显示
    if (testData.diagnosis.type === 'comprehensive_checkup') {
        return renderComprehensiveTable(testData);
    }
    
    let tableContent = `<table class="eve-table">
        <thead>
            <tr>
                <th>检验项目</th>
                <th>检验结果</th>`;
    
    // 根据数据动态添加列
    if (testData.results[0]?.unit !== undefined) {
        tableContent += `<th>单位</th>`;
    }
    
    tableContent += `<th>状态</th>
                <th>参考范围</th>
            </tr>
        </thead>
        <tbody>`;

    testData.results.forEach(result => {
        tableContent += `<tr>
            <td>${result.name}</td>
            <td class="${result.isNormal ? 'eve-status-normal' : 'eve-status-abnormal'}">${result.value}</td>`;
        
        if (result.unit !== undefined) {
            tableContent += `<td>${result.unit}</td>`;
        }
        
        tableContent += `<td class="${result.isNormal ? 'eve-status-normal' : 'eve-status-abnormal'}">${result.status}</td>
            <td>${result.reference}</td>
        </tr>`;
    });

    tableContent += `</tbody></table>`;
    return tableContent;
}

// 渲染综合体检表格（按类别分组）
function renderComprehensiveTable(testData) {
    let content = '';
    
    // 按类别分组
    const categories = {};
    testData.results.forEach(result => {
        if (!categories[result.category]) {
            categories[result.category] = [];
        }
        categories[result.category].push(result);
    });

    // 为每个类别创建表格
    Object.keys(categories).forEach(category => {
        content += `<h4 style="color: #e17055; margin: 20px 0 10px 0; display: flex; align-items: center; gap: 8px;">
            <span>🔬</span> ${category}
        </h4>`;
        
        content += `<table class="eve-table" style="margin-bottom: 20px;">
            <thead>
                <tr>
                    <th>检验项目</th>
                    <th>检验结果</th>
                    <th>单位</th>
                    <th>状态</th>
                    <th>参考范围</th>
                </tr>
            </thead>
            <tbody>`;

        categories[category].forEach(result => {
            content += `<tr>
                <td>${result.name}</td>
                <td class="${result.isNormal ? 'eve-status-normal' : 'eve-status-abnormal'}">${result.value}</td>
                <td>${result.unit || ''}</td>
                <td class="${result.isNormal ? 'eve-status-normal' : 'eve-status-abnormal'}">${result.status}</td>
                <td>${result.reference}</td>
            </tr>`;
        });

        content += `</tbody></table>`;
    });

    // 添加体格检查结果
    if (testData.physicalExam && testData.physicalExam.length > 0) {
        content += `<h4 style="color: #e17055; margin: 20px 0 10px 0; display: flex; align-items: center; gap: 8px;">
            <span>👩‍⚕️</span> 体格检查
        </h4>`;
        
        testData.physicalExam.forEach(exam => {
            content += `<div class="eve-info-box" style="margin-bottom: 10px;">
                <strong>${exam.type}：</strong>
                <ul style="margin: 5px 0 0 20px;">`;
            
            exam.findings.forEach(finding => {
                content += `<li>${finding}</li>`;
            });
            
            content += `</ul></div>`;
        });
    }

    // 添加影像检查结果
    if (testData.imagingResults && testData.imagingResults.length > 0) {
        content += `<h4 style="color: #e17055; margin: 20px 0 10px 0; display: flex; align-items: center; gap: 8px;">
            <span>📸</span> 影像检查
        </h4>`;
        
        testData.imagingResults.forEach(imaging => {
            content += `<div class="eve-info-box" style="margin-bottom: 10px;">
                <strong>${imaging.type}：</strong>
                <ul style="margin: 5px 0 0 20px;">`;
            
            imaging.findings.forEach(finding => {
                content += `<li>${finding}</li>`;
            });
            
            content += `</ul></div>`;
        });
    }

    return content;
}

// 渲染图表
function renderChart() {
    try {
        // 检查是否有甲状腺数据或甲状腺历史数据
        const hasThyroidChart = testsData.thyroid && configData.availableTests.thyroid?.hasChart;
        const hasHistoryChart = testsData.thyroid_history && configData.availableTests.thyroid_history?.hasChart;
        
        if (!hasThyroidChart && !hasHistoryChart) {
            // 查找图表卡片并隐藏
            const chartCard = document.querySelector('#thyroidChart')?.closest('.eve-card');
            if (chartCard) {
                chartCard.style.display = 'none';
            }
            return;
        }

        const chartElement = document.getElementById('thyroidChart');
        if (!chartElement) {
            return;
        }

        const ctx = chartElement.getContext('2d');
        
        // 优先显示甲状腺历史对比图表
        if (hasHistoryChart) {
            renderThyroidHistoryChart(ctx, testsData.thyroid_history);
        } else {
            renderCurrentThyroidChart(ctx, testsData.thyroid);
        }
    } catch (error) {
        console.error('渲染图表时出错:', error);
    }
}

// 渲染甲状腺历史对比图表
function renderThyroidHistoryChart(ctx, historyData) {
    const labels = historyData.historyData.map(item => item.date);
    const datasets = [];

    // TGAb数据集
    const tgabData = historyData.historyData.map(item => item.tgab);
    datasets.push({
        label: 'TGAb抗体 (IU/mL)',
        data: tgabData,
        borderColor: '#e17055',
        backgroundColor: 'rgba(225, 112, 85, 0.1)',
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: '#e17055',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        yAxisID: 'y'
    });

    // TPOAb数据集
    const tpoabData = historyData.historyData.map(item => item.tpoab);
    datasets.push({
        label: 'TPOAb抗体 (kIU/L)',
        data: tpoabData,
        borderColor: '#00b894',
        backgroundColor: 'rgba(0, 184, 148, 0.1)',
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: '#00b894',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        yAxisID: 'y1'
    });

    const thyroidChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '甲状腺抗体水平历史变化趋势 (2020-2024)',
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    color: '#2d3436',
                    padding: 20
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#2d3436',
                    bodyColor: '#2d3436',
                    borderColor: '#fd79a8',
                    borderWidth: 1,
                    cornerRadius: 10,
                    padding: 12,
                    callbacks: {
                        afterBody: function(context) {
                            const dataIndex = context[0].dataIndex;
                            const item = historyData.historyData[dataIndex];
                            return [`检查机构: ${item.institution}`];
                        }
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'TGAb抗体 (IU/mL)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        color: '#e17055'
                    },
                    grid: {
                        color: 'rgba(225, 112, 85, 0.1)',
                        lineWidth: 1
                    },
                    ticks: {
                        font: {
                            size: 12
                        },
                        color: '#e17055'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'TPOAb抗体 (kIU/L)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        color: '#00b894'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        font: {
                            size: 12
                        },
                        color: '#00b894'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '检查日期',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        color: '#2d3436'
                    },
                    grid: {
                        color: 'rgba(253, 121, 168, 0.1)',
                        lineWidth: 1
                    },
                    ticks: {
                        font: {
                            size: 12
                        },
                        color: '#636e72'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// 渲染当前甲状腺图表
function renderCurrentThyroidChart(ctx, thyroidData) {
    if (!thyroidData.trendData || !thyroidData.trendData.datasets) {
        return;
    }
    
    const datasets = thyroidData.trendData.datasets.map(dataset => ({
        label: dataset.name,
        data: dataset.data,
        borderColor: dataset.color,
        backgroundColor: `${dataset.color}20`,
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: dataset.color,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6
    }));
    
    const thyroidChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: thyroidData.trendData.labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '甲状腺功能指标变化趋势',
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    color: '#2d3436',
                    padding: 20
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#2d3436',
                    bodyColor: '#2d3436',
                    borderColor: '#fd79a8',
                    borderWidth: 1,
                    cornerRadius: 10,
                    padding: 12
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: '数值',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        color: '#2d3436'
                    },
                    grid: {
                        color: 'rgba(253, 121, 168, 0.1)',
                        lineWidth: 1
                    },
                    ticks: {
                        font: {
                            size: 12
                        },
                        color: '#636e72'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '检查日期',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        color: '#2d3436'
                    },
                    grid: {
                        color: 'rgba(253, 121, 168, 0.1)',
                        lineWidth: 1
                    },
                    ticks: {
                        font: {
                            size: 12
                        },
                        color: '#636e72'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            elements: {
                point: {
                    hoverRadius: 8
                }
            }
        }
    });
}

// 渲染建议部分 - 现在只显示简单的总结信息
function renderRecommendations() {
    try {
        // 更安全地查找建议卡片
        const container = document.querySelector('.eve-container');
        if (!container) {
            console.error('找不到eve-container元素');
            return;
        }

        const cards = container.querySelectorAll('.eve-card');
        let recommendationsCard = null;

        // 查找建议卡片 - 应该是倒数第二个卡片（最后一个是footer-info）
        if (cards.length >= 2) {
            recommendationsCard = cards[cards.length - 1]; // 最后一个卡片
            
            // 如果最后一个卡片没有内容或者只是占位符，使用倒数第二个
            if (!recommendationsCard.innerHTML.trim() || recommendationsCard.innerHTML.includes('通过JavaScript动态加载')) {
                recommendationsCard = cards[cards.length - 2];
            }
        }

        if (!recommendationsCard) {
            console.error('找不到建议卡片');
            return;
        }
        
        // 显示一个简单的总结信息，说明建议已集成到各检测项目中
        let content = `<h3 class="notes-title">📖 使用说明</h3>
            <div class="eve-note-item" style="background: rgba(116, 185, 255, 0.1); border-left-color: #74b9ff;">
                <strong>📋 查看建议：</strong> 每个检测项目的详细建议和注意事项已经集成在对应的检测结果下方，请查看各项目的"医生建议与注意事项"部分。
            </div>
            <div class="eve-note-item" style="background: rgba(253, 121, 168, 0.1); border-left-color: #fd79a8;">
                <strong>🔄 复查提醒：</strong> ${configData.generalNotes || '请根据医生建议定期复查各项指标，密切关注身体变化。'}
            </div>`;

        recommendationsCard.innerHTML = content;
    } catch (error) {
        console.error('渲染建议部分时出错:', error);
    }
}

// 页面加载完成后加载数据
window.addEventListener('load', function() {
    loadData();
});

// 返回顶部按钮功能
window.addEventListener('scroll', function() {
    const backToTopBtn = document.getElementById('backToTop');
    if (window.pageYOffset > 300) {
        backToTopBtn.classList.add('show');
    } else {
        backToTopBtn.classList.remove('show');
    }
});

document.getElementById('backToTop').addEventListener('click', function() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// 添加表格行的悬停效果
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        document.querySelectorAll('.eve-table tbody tr').forEach(row => {
            row.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.02)';
                this.style.transition = 'transform 0.2s ease';
            });
            
            row.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
            });
        });
    }, 1000);
});
