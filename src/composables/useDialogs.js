import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
import { steps, stepClass } from "../utils/workflow.js";
import {
  getTodayOverview,
  getOverviewTasks,
  getDeviceTasks,
  getDeviceCard,
  getDeviceRepairs,
  getDashboardList,
  getOverviewCounts,
  getWorkDetail,
  getWorkExceptions,
  getWorkCards,
} from "../api/api.js";

// 管理弹窗数据、分页和返回关系；界面由 components 中的独立组件负责。
export function useDialogs(counts, trains) {
  // 检查卡片复用 detail，进入前保存设备主卡，返回时恢复。
  let returnDetail = null;
  const modal = ref(""),
    title = ref(""),
    rows = ref([]),
    total = ref(0),
    page = ref(1),
    tab = ref("all"),
    device = ref(null);
  const detail = ref({}),
    detailTab = ref("设备主卡"),
    busy = ref(false),
    error = ref(""),
    selectedTrain = ref(""),
    selectedStep = ref("");
  const selectedStepId = ref(""),
    stepDetail = ref({}),
    exceptions = ref({}),
    cardList = ref([]),
    overviewCounts = ref({});
  const workDevice = ref(""),
    workTrain = ref("");
  const cardIndex = ref(0),
    returnModal = ref(""),
    returnTitle = ref(""),
    previewFile = ref(null);

  const deviceNames = {
    468990001: "升降台",
    468990002: "升降台",
    468990003: "升降台",
    468990004: "升降台",
    941990003: "清洗机",
    941990004: "清洗机",
    743990013: "预热器试验台",
    743290002: "风机试验台",
    743990016: "空调机组通电试验台",
    743990015: "空调机组通电试验台",
    743220003: "空调机组性能试验台",
    743220004: "空调机组性能试验台",
  };
  const statusLabels = {
    RW_02_DAP: "待安排",
    RW_03_DXDBZ: "待下达班组",
    RW_03_XGPBZ: "需改派班组",
    RW_03_DXDRY: "未派工",
    RW_03_XGPRY: "需改派人员",
    RW_04_DJS: "未接单",
    RW_04_DCL: "未开工",
    RW_05_CLZ: "作业中",
    RW_06_ZLSH: "工长复查",
    RW_07_GDGB: "工单完成",
    RW_00_GDQX: "工单取消",
  };
  const workColumns = [
    ["attribute27", "修程"],
    ["attribute28", "作业名称"],
    ["rwgdSjks", "开工时间"],
    ["rwgdSjjs", "完工时间"],
    ["rwgdStatus", "任务状态"],
    ["rwgdCzh", "车组号"],
    ["rwgdJsrName", "接收人"],
  ];
  const columns = computed(() => {
    if (modal.value === "material")
      return [
        ["tlTime", "提报时间"],
        ["clCode", "车号"],
        ["wlName", "物料名称"],
        ["ggxh", "规格型号"],
        ["wlNum", "物料数量"],
        ["attribute6", "提级情况"],
        ["wlStatus", "物料状态"],
        ["attribute3", "提报班组"],
        ["attribute1", "处理进度"],
      ];
    if (modal.value === "production")
      return [
        ["attribute15", "提报时间"],
        ["clCode", "车号"],
        ["errorDescribe", "问题描述"],
        ["errorType", "问题类型"],
        ["ytzlcljdsm", "处理进度"],
        ["attribute8", "提级情况"],
        ["state", "状态"],
      ];
    if (modal.value === "fault")
      return [
        ["rq", "日期"],
        ["sbmc", "设备名称"],
        ["sbllid", "设备编号"],
        ["fsdd", "使用部门"],
        ["sgyy", "故障现象"],
        ["sgms", "维修状态"],
      ];
    if (modal.value === "device" && detailTab.value === "故障报修信息")
      return [
        ["yearAndMonth", "年/月/日"],
        ["sybm", "使用部门"],
        ["sbmc", "设备名称"],
        ["sbbh", "设备编号"],
        ["gzbxsj", "故障报修时间"],
        ["gzxx", "故障现象"],
        ["wxzt", "维修状态"],
      ];
    if (modal.value === "overview" && tab.value === "all")
      return [["czh", "车组号"], ...steps.map((item) => [item.key, item.name])];
    return workColumns;
  });
  function display(value) {
    if (value == null || value === "") return "--";
    return statusLabels[value] || String(value);
  }
  // 今日总览分页；作业中、作业超时、待料异常、生产异常、设备故障弹窗共用分页入口。
  async function loadList() {
    busy.value = true;
    error.value = "";
    rows.value = [];
    total.value = 0;
    try {
      let result;
      if (modal.value === "overview") {
        if (tab.value === "all") {
          result = await getTodayOverview();
          rows.value = result.data || [];
          total.value = rows.value.length;
        } else {
          result = await getOverviewTasks(page.value, tab.value);
          rows.value = result.rows || [];
          total.value = result.total || 0;
        }
      } else if (modal.value === "modelWork") {
        result = await getDeviceTasks(page.value, workDevice.value, workTrain.value);
        rows.value = result.data?.rows || [];
        total.value = result.data?.total || 0;
      } else if (modal.value === "device") {
        if (detailTab.value === "设备主卡") {
          result = await getDeviceCard(device.value);
          detail.value = result.data || result;
        } else if (detailTab.value === "故障报修信息") {
          result = await getDeviceRepairs(page.value, device.value);
          rows.value = result.rows || [];
          total.value = result.total || 0;
        } else {
          result = await getDeviceTasks(page.value, device.value);
          rows.value = result.data?.rows || [];
          total.value = result.data?.total || 0;
        }
      } else {
        const count =
          counts.value[
            { material: "dlNum", production: "scNum", fault: "gzNum" }[
              modal.value
            ]
          ] || 0;
        result = await getDashboardList(modal.value, page.value, count);
        rows.value = result.rows || result.data?.rows || [];
        total.value = result.total || result.data?.total || 0;
      }
    } catch (err) {
      error.value = err.message;
    } finally {
      busy.value = false;
    }
  }
  // 今日总览弹窗（原 vue.js：今日总览、今日总览tab）。
  async function openMenu(item) {
    modal.value = item.key;
    title.value = item.label === "今日总览" ? item.label : item.label + "信息";
    page.value = 1;
    tab.value = "all";
    if (item.key === "overview")
      getOverviewCounts()
        .then((res) => {
          overviewCounts.value = res.data || {};
        })
        .catch(console.error);
    await loadList();
  }
  async function openDevice(id) {
    device.value = id;
    title.value = (deviceNames[id] || "升降台") + "信息";
    detailTab.value = "设备主卡";
    modal.value = "device";
    page.value = 1;
    detail.value = {};
    await loadList();
  }
  async function openModelWork(item) {
    workDevice.value = item.id;
    workTrain.value = item.mroRwgd?.rwgdCzh || "";
    modal.value = "modelWork";
    title.value = `${workTrain.value}工单信息`;
    page.value = 1;
    await loadList();
  }
  async function changeDeviceTab(value) {
    detailTab.value = value;
    page.value = 1;
    await loadList();
  }
  // 根据车组号加载数据，切换工序时同时读取作业明细和异常明细。
  async function openStep(item, step) {
    if (!item || !step) return;
    selectedTrain.value = item.czh;
    selectedStep.value = step.name;
    selectedStepId.value =
      item[step.key + "GdId"] || (step.key === "fj" ? item.fjCxGdId : "");
    modal.value = "step";
    title.value = "今日总览明细";
    stepDetail.value = {};
    exceptions.value = {};
    cardList.value = [];
    tab.value = "work";
    error.value = "";
    if (!selectedStepId.value) return;
    const results = await Promise.allSettled([
      getWorkDetail(selectedStepId.value),
      getWorkExceptions(selectedStepId.value),
    ]);
    if (results[0].status === "fulfilled") {
      const data = results[0].value.data || {};
      stepDetail.value = {
        ...data.topData,
        zyry: (data.gdzxData?.rgData || []).map((x) => x.rgYgxm).join("，"),
      };
      if (stepDetail.value.rwgdCode)
        getWorkCards(stepDetail.value.rwgdCode)
          .then((res) => {
            cardList.value = res.data || [];
          })
          .catch(console.error);
    }
    if (results[1].status === "fulfilled")
      exceptions.value = results[1].value.data || {};
    if (results.every((result) => result.status === "rejected"))
      error.value = "工序详情加载失败";
  }
  // 今日总览明细检查卡片：关闭卡片后返回来源弹窗。
  async function openCard(code) {
    if (!code) {
      error.value = "没有关联的工单号";
      return;
    }
    busy.value = true;
    error.value = "";
    try {
      const result = await getWorkCards(code);
      returnModal.value = modal.value;
      returnTitle.value = title.value;
      returnDetail = detail.value;
      detail.value = Array.isArray(result.data) ? result.data : [];
      cardIndex.value = 0;
      modal.value = "card";
      title.value = "工单信息";
    } catch (err) {
      error.value = err.message;
    } finally {
      busy.value = false;
    }
  }
  function preview(file) {
    previewFile.value = file;
  }

  function close() {
    if (previewFile.value) {
      previewFile.value = null;
      return;
    }
    if (modal.value === "card" && returnModal.value) {
      modal.value = returnModal.value;
      title.value = returnTitle.value;
      detail.value = returnDetail;
      returnDetail = null;
      returnModal.value = "";
      return;
    }
    modal.value = "";
    error.value = "";
  }
  function onKey(event) {
    if (event.key === "Escape") close();
  }
  function setPage(value) {
    page.value = value;
    loadList();
  }

  onMounted(() => window.addEventListener("keydown", onKey));
  onUnmounted(() => window.removeEventListener("keydown", onKey));
  return reactive({
    modal,
    title,
    rows,
    total,
    page,
    tab,
    device,
    detail,
    detailTab,
    busy,
    error,
    selectedTrain,
    selectedStep,
    selectedStepId,
    stepDetail,
    exceptions,
    cardList,
    overviewCounts,
    cardIndex,
    previewFile,
    columns,
    steps,
    display,
    stepClass,
    loadList,
    openMenu,
    openDevice,
    openModelWork,
    changeDeviceTab,
    openStep,
    openCard,
    preview,
    close,
    setPage,
    trains,
  });
}

