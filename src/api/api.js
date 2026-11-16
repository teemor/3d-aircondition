// 所有后端接口统一维护。开发环境由 Vite 转发 /prod-api 和 /mybucket。
export const deviceIds = [
  "468990001",
  "468990002",
  "468990003",
  "468990004",
  "941990003",
  "468990005",
  "468990009",
  "468990007",
  "743990016",
  "743220003",
  "743990013",
  "743290002",
  "941990004",
  "468990010",
  "468990008",
  "468990006",
  "743990015",
  "743220004",
];

// 保留接口原有 data / rows / total 层级，由对应业务读取。
async function request(path, params = {}, body) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(
    `/prod-api/${path}${query ? "?" + query : ""}`,
    body === undefined
      ? {}
      : {
          method: "POST",
          headers: { "Content-Type": "application/json;charset=UTF-8" },
          body: JSON.stringify(body),
        },
  );
  if (!response.ok) throw new Error(`接口请求失败 (${response.status})`);
  const result = await response.json();
  if (result.code !== undefined && result.code !== 200)
    throw new Error(result.msg || "接口返回错误");
  return result;
}

const overviewParams = () => ({ cx: "kt", id: deviceIds.join(",") });
const pagination = (page) => ({ pageNum: page, pageSize: 10 });

// 设备实时状态、完成数量；数量接口异常时仍允许刷新模型状态。
export const getDeviceStates = () =>
  request("emisdp/sbState", {}, { id: deviceIds });
export const getDashboardCounts = () =>
  request("emisdp/number", {}, { id: deviceIds });
export async function loadDashboardData() {
  const [state, count] = await Promise.all([
    getDeviceStates(),
    getDashboardCounts().catch(() => null),
  ]);
  return {
    states: Array.isArray(state.data) ? state.data : [],
    counts: count?.data,
  };
}

// 生产异常安灯报警；计量吊具管理系统（原 vue.js 业务注释）。
export const getAlarms = () => request("emisdp/scycWarning", { type: 1 });
export const getGauges = () =>
  request("emisdp/jldj", { type: 1, pageNum: 1, pageSize: 5 });

// 3D 场景异常设备：yichang 为 1 的设备以 300ms 红色闪烁（原 vue.js getState）。
export const getAbnormalDevices = () =>
  request("emisdp/queryCardByTw", {}, { twList: deviceIds });

// 机辆检修记录（原 dialog.js recordDialog）：type=today|history，
// 历史分支需 rwgdSjks / rwgdSjjs（YYYY-MM-DD）。
export const getMaintenanceRecords = (page, params = {}) =>
  request("emisdp/jxjlList", { ...pagination(page), ...params });

// 完成数量折线图（原 vue.js initLineCharts，air.js 模板中已注释）。
export const getBeatStats = () =>
  request("emisdp/beatNum", { type: 1, queryType: "KT_3D" });

// 今日总览全部、今日总览tab、今日总览分页。
export const getTodayOverview = () =>
  request("emisdp/queryTodayZl2", overviewParams());
export const getOverviewCounts = () =>
  request("emisdp/queryTodayZlNum", overviewParams());
export const getOverviewTasks = (page, type) =>
  request("emisdp/queryTodayZl", {
    ...pagination(page),
    type,
    id: deviceIds.join(","),
  });

// 今日作业弹窗：设备面板和设备主卡共用，车组号可选。
export const getDeviceTasks = (page, deviceId, train) =>
  request("emisdp/jrrw", {
    ...pagination(page),
    twCode: deviceId,
    ...(train === undefined ? {} : { czh: train }),
  });
export const getDeviceCard = (deviceId) =>
  request("emisdp/sbgood", { sbllid: deviceId });
export const getDeviceRepairs = (page, deviceId) =>
  request("business/sbglHomePage/wxkb", {
    ...pagination(page),
    sbllid: deviceId,
  });

// 作业中弹窗、作业超时弹窗、待料异常弹窗、生产异常弹窗、设备故障弹窗、机组记录弹窗。
const listPaths = {
  working: "emisdp/dpListB1",
  timeout: "emisdp/dpListB2",
  material: "emisdp/dpListB3",
  production: "emisdp/dpListB4",
  fault: "emisdp/dpListB5",
  todayWork: "emisdp/dpListA2",
  finished: "emisdp/dpListA3",
  hung: "emisdp/dpListB6",
  pending: "emisdp/dpListB7",
};
export function getDashboardList(kind, page, total = 0) {
  if (!listPaths[kind]) throw new Error("未知的列表类型");
  return request(
    listPaths[kind],
    { ...pagination(page), total },
    kind === "fault" ? { id: deviceIds } : undefined,
  );
}

// 根据车组号加载数据；今日总览明细检查卡片。
export const getWorkDetail = (id) =>
  request(`business/rwzx/${encodeURIComponent(id)}`);
export const getWorkExceptions = (id) =>
  request("emisdp/queryZlYcMx", { gdId: id, cx: "kt" });
export const getWorkCards = (code) =>
  request("business/jcxd/listByRwgdCode", { rwgdCode: code });

// 附件路径兼容完整 URL、mybucket 前缀和相对路径。
export function attachmentUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `/mybucket/${String(path).replace(/^\/?(?:mybucket\/)?/, "")}`;
}

export async function fetchAttachment(path) {
  const response = await fetch(attachmentUrl(path));
  if (!response.ok) throw new Error(`文件请求失败 (${response.status})`);
  // 原 vue.js：重要：将响应类型设置为 'blob'。
  return response.blob();
}
