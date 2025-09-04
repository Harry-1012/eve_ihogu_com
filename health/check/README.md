# Eve健康档案系统

## 📁 文件结构

```
eve/health/check/
├── index.html          # 主页面文件
├── data/               # 数据文件夹
│   ├── config.json     # 系统配置文件
│   ├── patient.json    # 患者基本信息（已弃用，合并到config.json）
│   ├── thyroid.json    # 甲状腺功能检测数据
│   ├── allergy.json    # 过敏原检测数据
│   ├── blood.json      # 血常规检测数据（示例）
│   └── ...             # 其他检测类型数据文件
└── README.md           # 说明文档
```

## 🚀 如何添加新的检测类型

### 1. 创建数据文件
在 `data/` 文件夹下创建新的JSON文件，例如 `liver.json`：

```json
{
  "diagnosis": {
    "name": "肝功能检查",
    "type": "liver",
    "icon": "🫀",
    "color": "#f39c12"
  },
  "testInfo": {
    "date": "2025-01-20",
    "time": "09:00",
    "method": "生化分析",
    "institution": "医院检验科"
  },
  "results": [
    {
      "name": "丙氨酸氨基转移酶 (ALT)",
      "value": "25",
      "unit": "U/L",
      "status": "正常",
      "reference": "9 - 50",
      "isNormal": true
    }
    // ... 更多检测项目
  ],
  "recommendations": {
    "diagnosis": "检查说明",
    "treatment": "治疗建议",
    "lifestyle": ["生活建议1", "生活建议2"]
  }
}
```

### 2. 更新配置文件
在 `config.json` 中添加新的检测类型：

```json
{
  "activeTests": ["allergy", "thyroid", "liver"],
  "availableTests": {
    // ... 现有配置
    "liver": {
      "name": "肝功能",
      "dataFile": "liver.json",
      "hasChart": false,
      "order": 4
    }
  }
}
```

### 3. 系统自动加载
页面会自动读取 `activeTests` 中的检测类型并显示对应的数据。

## 📊 数据文件格式说明

### 基本检测数据格式
- `diagnosis`: 诊断信息（名称、类型、图标、颜色）
- `testInfo`: 检测信息（日期、时间、方法、机构）
- `results`: 检测结果数组
- `recommendations`: 医生建议

### 特殊格式
- **过敏检测**: results字段使用 `category`, `allergen`, `sensitivity`, `igeValue`, `season`
- **甲状腺检测**: 包含 `trendData` 用于生成趋势图
- **用药信息**: 过敏检测包含 `medications` 数组

## 🎨 自定义样式

每种检测类型可以设置：
- `icon`: 显示的emoji图标
- `color`: 主题颜色（标题颜色）
- `type`: 类型标识（用于特殊处理）

## 💡 使用建议

1. **数据更新**: 只需修改对应的JSON文件即可更新数据
2. **新增检测**: 创建新的JSON文件并在config.json中注册
3. **禁用检测**: 从config.json的activeTests中移除即可
4. **排序**: 通过order字段控制显示顺序

## 🔧 技术特性

- 响应式设计，支持手机和电脑访问
- 数据与界面分离，便于维护
- 支持动态加载多种检测类型
- 自动错误处理和数据验证
- Chart.js支持的趋势图表功能

## 📝 注意事项

- JSON文件必须符合标准格式，否则可能导致页面加载失败
- 图标建议使用emoji，保证跨平台兼容性
- 颜色值使用十六进制格式，如 `#e74c3c`
- 日期格式统一使用 `YYYY-MM-DD` 格式
