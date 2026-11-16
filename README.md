# 空调产线可视化中心

Vue 3 + Vite 项目。运行 `npm install` 后执行 `npm run dev`。

项目使用 `public/models/aircondition_production_line_neutral.glb` 和原备份中的 18 个设备编号。开发服务将 `/prod-api` 和 `/mybucket` 代理至 `http://10.223.20.19`，可通过 `VITE_API_PROXY_TARGET` 配置。正式部署需要在 Web 服务器上配置相同的反向代理。

代码维护入口：

- `src/api/api.js`：全部后端接口、请求错误处理、设备编号、附件地址及二进制文件读取。功能代码只调用命名接口函数。
- `src/components/BaseDialog.vue`：弹窗公共外框。
- `src/components/OverviewDialog.vue`：今日总览及状态分类。
- `src/components/DeviceDialog.vue`：设备主卡、故障报修、今日任务。
- `src/components/StepDetailDialog.vue`：车组工序、作业明细和异常明细。
- `src/components/WorkCardDialog.vue`：检查卡片和附件列表。
- `src/components/FilePreviewDialog.vue`：图片、PDF、Word、Excel 附件预览。
- `src/components/DialogTable.vue`：作业、异常列表及分页共用表格。
- `src/components/DashboardDialogs.vue`：弹窗入口与组件切换。
- `src/composables/useDialogs.js`：弹窗数据加载、分页、标签切换及返回关系。
- `src/utils/workflow.js`：过程节拍工序及状态规则。

原 `vue.js` 中与当前迁移功能对应的业务注释已放到接口和弹窗逻辑旁；旧项目未迁移的逻辑、调试代码不在本次结构整理中引入。

目前已接入设备状态、统计、过程节拍、异常及设备详情等接口，每 10 秒刷新。检查卡片提供图片、PDF、DOCX、XLSX 附件预览和下载。原页面的弹窗字段、筛选、分页和详情流程尚未全部迁移；人员动画按要求不实现。模型视角、设备点击及附件预览尚需浏览器逐项验证。

模型来自 `C:\Users\1\WorkBuddy\2026-10-29-13-58-33\workshop3d\out`，其节点名称与原始脚本编号有重复和缺失，点击映射需要结合现场逐项核对。
