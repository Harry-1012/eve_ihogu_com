
var data = [
  [355, 560, 4, 6, 0, 0, 26],
];

// 初始化时保留默认数据副本
window.defaultData = [...data]; // 新增默认数据备份
function drawGrid(currentData) {
  var gridContainer = document.querySelector(".grid-container");
  var canvas = document.getElementById("gridCanvas");
  canvas.innerHTML = "";

  // 新增：清理旧尺寸标注
  var oldLabels = gridContainer.querySelectorAll('.dimension-label');
  oldLabels.forEach(label => label.remove());
  var lengthPoints = currentData[2] - 1;
  var widthPoints = currentData[3] - 1;

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

 

    // 添加右侧延伸图（跳过首尾行）
    if (i !== 0 && i !== lengthPoints) { // 新增判断条件
      var rightExtension = document.createElement("div");
      rightExtension.className = "right-extension";
      rightExtension.style.top = `calc(${(i * 100) / lengthPoints}% - ${pianyi}px)`;
      canvas.appendChild(rightExtension);
    }
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

    // 隐藏最右侧列的顶部延伸图
    if (i !== widthPoints) {
      var topExtension = document.createElement("div");
      topExtension.className = "top-extension";
      let pianyi = 3.8;
      topExtension.style.left = `calc(${(i * 100) / widthPoints}% - ${pianyi}px)`;
      canvas.appendChild(topExtension);
    }

    // 隐藏最右侧列的底部延伸图
    if (i !== widthPoints) {
      var bottomExtension = document.createElement("div");
      bottomExtension.className = "bottom-extension";
      bottomExtension.style.left = `calc(${(i * 100) / widthPoints}% - ${pianyi}px)`;
      canvas.appendChild(bottomExtension);
    }
  }

  // 绘制锚点时添加判断条件
  for (let i = 0; i <= widthPoints; i++) {
    for (let j = 0; j <= lengthPoints; j++) {
      // 隐藏最右侧列的首尾锚点
      if (i === widthPoints && (j === 0 || j === lengthPoints)) {
        continue;
      }
      var point = document.createElement("div");
      point.className = "anchor-point";
      point.style.left = `${(i * 100) / widthPoints}%`;
      point.style.top = `${(j * 100) / lengthPoints}%`;
      canvas.appendChild(point);
    }
  }
}

// 初始化页面 
drawGrid(data[0]); 