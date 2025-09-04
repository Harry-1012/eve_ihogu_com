
var data = [
    [360, 760, 4, 6, 120.0, 152.0, 20],
    [560, 1060, 5, 8, 140.0, 151.4, 26],
    [510, 970, 5, 7, 127.5, 161.7, 24],
    [450, 1150, 4, 9, 150.0, 143.8, 26],
    [360, 760, 3, 6, 180.0, 152.0, 18],
    [460, 1060, 4, 8, 153.3, 151.4, 24],
    [355, 560, 4, 5, 118.3, 140.0, 18],
  ];

// 新增截图保存功能
function saveAsImage() {
    // 隐藏非目标元素
    const nonTarget = document.querySelector('.containerinfo');
    const originalDisplay = nonTarget.style.display;
    
    // 新增批量导出逻辑
    const rows = document.querySelectorAll('#tableBody tr');
    let currentIndex = 0;

    function exportNext() {
        if (currentIndex < rows.length) {
            // 模拟点击行触发图形更新
            rows[currentIndex].click();
            
            // 等待UI更新
            setTimeout(() => {
                html2canvas(document.querySelector('.needcanvas'), {
                    useCORS: true,
                    scale: 2
                }).then(canvas => {
                    var fileName = `${currentIndex + 1}_` + document.getElementById('currentRowInfo').textContent
                        .replace(/current info:/, '')
                        .replace(/[: ]/g, '_') + '.png';

                    var link = document.createElement('a');
                    link.download = fileName;
                    link.href = canvas.toDataURL();
                    link.click();
                    
                    currentIndex++;
                    exportNext(); // 继续处理下一行
                }).catch(error => {
                    console.error(`第${currentIndex + 1}行截图失败:`, error);
                    currentIndex++;
                    exportNext();
                });
            }, 500); // 增加500ms延迟确保界面更新
        }
    }

    exportNext(); // 开始导出流程
}
// 修改importExcelData函数实现数据覆盖
function importExcelData() {
    var input = document.getElementById('excelFileInput');
    var file = input.files[0];
    if (file) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var arrayBuffer = e.target.result;
            var workbook = XLSX.read(arrayBuffer, { type: 'array' });
            var firstSheetName = workbook.SheetNames[0];
            var worksheet = workbook.Sheets[firstSheetName];
            let newData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if(newData.length > 0 && Array.isArray(newData[0])) {
                newData = newData.slice(1); 
            }

            window.defaultData = [...data];
            data.length = 0;
            
            newData.forEach(row => {
                // 新增小数处理：所有数值保留1位小数
                var processedRow = row.map(cell => {
                    var num = parseFloat(cell);
                    return isNaN(num) ? cell : Number(num.toFixed(1));
                });
                data.push(processedRow);
            });
            
            populateTable();
            drawGrid(data[0]);
            document.getElementById("currentRowInfo").textContent = 
                `W${data[0][0]},L${data[0][1]}, Points${data[0][2]},${data[0][3]} Total Anchor Points ${data[0][6]}`;
        };
        reader.readAsArrayBuffer(file);
    }
}

// 初始化时保留默认数据副本
window.defaultData = [...data]; // 新增默认数据备份
function drawGrid(currentData) {
    var gridContainer = document.querySelector(".grid-container");
    var canvas = document.getElementById("gridCanvas");
    canvas.innerHTML = "";
    
    // 新增：清理旧尺寸标注
    var oldLabels = gridContainer.querySelectorAll('.dimension-label');
    oldLabels.forEach(label => label.remove());
    var lengthPoints = currentData[2]-1;
    var widthPoints = currentData[3]-1;

    // 绘制水平线
    for (let i = 0; i <= lengthPoints; i++) {
      var line = document.createElement("div");
      line.className = "horizontal-line";
      line.style.top = `${(i * 100) / lengthPoints}%`;
      canvas.appendChild(line);

      // 添加左侧延伸图
      var leftExtension = document.createElement("div");
      leftExtension.className = "left-extension";
      let pianyi = 3.5;
      // 往上偏移 2.5 像素
      leftExtension.style.top = `calc(${(i * 100) / lengthPoints}% - ${pianyi}px)`;
      canvas.appendChild(leftExtension);

      // 添加右侧延伸图
      var rightExtension = document.createElement("div");
      rightExtension.className = "right-extension";
      // 往上偏移 2.5 像素
      rightExtension.style.top = `calc(${(i * 100) / lengthPoints}% - ${pianyi}px)`;
      canvas.appendChild(rightExtension);
    }

    // 绘制垂直线
    for (let i = 0; i <= widthPoints; i++) {
      var line = document.createElement("div");
      line.className = "vertical-line";
      line.style.left = `${(i * 100) / widthPoints}%`;
      canvas.appendChild(line);

      // 添加顶部延伸图
      var topExtension = document.createElement("div");
      topExtension.className = "top-extension";
      let pianyi = 3.8;
      // 往左偏移 2.5 像素
      topExtension.style.left = `calc(${(i * 100) / widthPoints}% - ${pianyi}px)`;
      canvas.appendChild(topExtension);

      // 添加底部延伸图
      var bottomExtension = document.createElement("div");
      bottomExtension.className = "bottom-extension";
      // 往左偏移 2.5 像素
      bottomExtension.style.left = `calc(${(i * 100) / widthPoints}% - ${pianyi}px)`;
      canvas.appendChild(bottomExtension);
    }

    // 绘制锚点
    for (let i = 0; i <= widthPoints; i++) {
      for (let j = 0; j <= lengthPoints; j++) {
        var point = document.createElement("div");
        point.className = "anchor-point";
        point.style.left = `${(i * 100) / widthPoints}%`;
        point.style.top = `${(j * 100) / lengthPoints}%`;
        canvas.appendChild(point);
      }
    }

    // 添加尺寸标注（已自动清理旧标注，现在只会各保留一个）
    var widthLabel = document.createElement("div");
    widthLabel.className = "dimension-label";
    widthLabel.textContent = `Length: ${currentData[1]}cm`;
    widthLabel.style.bottom = "1px";
    widthLabel.style.left = "50%";
    widthLabel.style.fontSize = "18px";
    widthLabel.style.transform = "translateX(-50%)";
    gridContainer.appendChild(widthLabel);

    var lengthLabel = document.createElement("div");
    lengthLabel.className = "dimension-label";
    lengthLabel.textContent = `Width: ${currentData[0]}cm`;
    lengthLabel.style.top = "50%";
    lengthLabel.style.fontSize = "18px";
    lengthLabel.style.right = "-48px";
    lengthLabel.style.transform = "translateY(-50%) rotate(90deg)";
    gridContainer.appendChild(lengthLabel);
}
  function populateTable() {
    var tableBody = document.getElementById("tableBody");
    tableBody.innerHTML = "";
    // 去重
    var uniqueData = [];
    var seen = new Set();
    data.forEach((item) => {
      var key = item.join('|');
      if (!seen.has(key)) {
        seen.add(key);
        uniqueData.push(item);
      }
    });
    data.length = 0;
    data.push(...uniqueData);
    data.forEach((row, index) => {
      var tr = document.createElement("tr");
      tr.style.cursor = "pointer";
      tr.addEventListener("click", () => {
        document.querySelectorAll("#tableBody tr").forEach((row) => {
          row.style.background = "";
        });
        tr.style.background = "#e6f3ff";
        drawGrid(data[index]);
        document.getElementById(
          "currentRowInfo"
        ).textContent = `W${data[index][0]}, L${data[index][1]}, Points(${data[index][2]},${data[index][3]}) Total Anchor Points ${data[index][6]}`;
    
          window.scrollTo(0, 0);
    
      });
      row.forEach((cell) => {
        var td = document.createElement("td");
        td.textContent = cell;
        tr.appendChild(td);
      });
      tableBody.appendChild(tr);
    });
  }

  // 初始化页面
  populateTable();
  drawGrid(data[0]);
  document.getElementById(
    "currentRowInfo"
  ).textContent = `W${data[0][0]}, L${data[0][1]}, Points(${data[0][2]},${data[0][3]}) Total Anchor Points ${data[0][6]}`;