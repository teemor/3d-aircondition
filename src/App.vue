<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import Scene3D from "./Scene3D.vue";
import {
  loadDashboardData,
  getAlarms,
  getGauges,
  getTodayOverview,
} from "./api/api.js";
import DashboardDialogs from "./components/DashboardDialogs.vue";
import { steps, stepClass } from "./utils/workflow.js";

const scene = ref(null),
  now = ref(new Date()),
  counts = ref({}),
  alarms = ref([]),
  gauges = ref({}),
  trains = ref([]);
const dialogs = ref(null);
let clockTimer, refreshTimer;
const date = computed(
  () =>
    `${now.value.getFullYear()}年${String(now.value.getMonth() + 1).padStart(2, "0")}月${String(now.value.getDate()).padStart(2, "0")}日 ${now.value.toLocaleTimeString("zh-CN", { hour12: false })}`,
);
const menus = [
  { label: "今日总览", image: "jrzl2.png", key: "overview", color: "#17f8f5" },
  {
    label: "作业中",
    image: "countyun.png",
    key: "working",
    count: "zyzNum",
    color: "#02cf7d",
  },
  {
    label: "作业超时",
    image: "countzuo.png",
    key: "timeout",
    count: "csNum",
    color: "#edb51f",
  },
  {
    label: "待料异常",
    image: "coutdai.png",
    key: "material",
    count: "dlNum",
    color: "#ff5013",
  },
  {
    label: "生产异常",
    image: "countsheng.png",
    key: "production",
    count: "scNum",
    color: "#ff5013",
  },
  {
    label: "设备故障",
    image: "coutshe.png",
    key: "fault",
    count: "gzNum",
    color: "#ff5013",
  },
];
async function refresh() {
  const tasks = [
    loadDashboardData(),
    getAlarms(),
    getGauges(),
    getTodayOverview(),
  ];
  const [state, alarm, gauge, train] = await Promise.allSettled(tasks);
  if (state.status === "fulfilled") {
    counts.value = state.value.counts || {};
    scene.value?.updateStates(state.value.states);
  }
  if (alarm.status === "fulfilled") alarms.value = alarm.value.data || [];
  if (gauge.status === "fulfilled") gauges.value = gauge.value.data || {};
  if (train.status === "fulfilled") trains.value = train.value.data || [];
  if (state.status === "rejected")
    console.error("设备状态更新失败", state.reason);
}
// 首次加载；10秒刷新一次（原 vue.js）。
onMounted(() => {
  refresh();
  clockTimer = setInterval(() => {
    now.value = new Date();
  }, 1000);
  refreshTimer = setInterval(refresh, 10000);
});
onUnmounted(() => {
  clearInterval(clockTimer);
  clearInterval(refreshTimer);
});
</script>

<template>
  <main class="screen">
    <div class="scene">
      <Scene3D
        ref="scene"
        @select="dialogs?.openDevice"
        @work="dialogs?.openModelWork"
      />
    </div>
    <header class="header">
      <div class="title">空调产线可视化中心</div>
      <time>{{ date }}</time>
    </header>
    <div class="top-panels">
      <section class="top-panel alarms">
        <h2>生产异常安灯报警</h2>
        <div v-if="alarms.length" class="panel-table">
          <div class="table-header">
            <span>问题描述</span><span>提报时间</span><span>类型</span>
          </div>
          <div
            v-for="(item, index) in alarms"
            :key="item.id || index"
            class="alarm-row"
          >
            <span>{{ index + 1 }}.{{ item.desc }}</span
            ><span>{{ item.fillDate }}</span
            ><span>{{ item.exceptionType }}</span>
          </div>
        </div>
        <div v-else class="empty">
          <img src="/legacy/no-data.png" alt="" />
          <div>当前无报警信息</div>
        </div>
      </section>
      <section class="top-panel progress-panel">
        <h2>过程节拍总览</h2>
        <div class="legend">
          <span
            v-for="item in [
              ['step_dkg.png', '待开工', '#d755ff'],
              ['step_zyz.png', '作业中', '#02bc62'],
              ['deng d.png', '等待', '#c0c4cc'],
              ['step_wc.png', '工单完成', '#409eff'],
              ['chao d.png', '超时', '#ffcf00'],
              ['step_yc.gif', '异常', 'red'],
            ]"
            :key="item[1]"
            :style="{ color: item[2] }"
            ><img :src="'/legacy/' + item[0]" alt="" />{{ item[1] }}</span
          >
        </div>
        <div class="train-list">
          <div
            v-for="(train, index) in trains"
            :key="train.czh || index"
            class="train"
          >
            <b>{{ train.czh }}</b>
            <div class="steps">
              <button
                v-for="step in steps"
                :key="step.key"
                class="step"
                :class="stepClass(train, step.key)"
                @click="dialogs?.openStep(train, step)"
              >
                <i></i><span>{{ step.name }}</span
                ><small
                  >{{ train[step.key + "StartTime"] || ""
                  }}{{
                    train[step.key + "EndTime"]
                      ? "-" + train[step.key + "EndTime"]
                      : ""
                  }}</small
                >
              </button>
            </div>
          </div>
        </div>
      </section>
      <section class="top-panel gauges">
        <h2>计量器具管理系统</h2>
        <div class="gauge-counts">
          <span>使用: {{ gauges.syNum ?? 0 }}</span
          ><span>送检中: {{ gauges.sjzNum ?? 0 }}</span
          ><span>预警: {{ gauges.yjNum ?? 0 }}</span
          ><span>超期: {{ gauges.cqNum ?? 0 }}</span>
        </div>
        <div v-if="gauges.list?.length" class="panel-table">
          <div class="table-header gauge-row">
            <span>序号</span><span>编号</span><span>名称</span
            ><span>到期时间</span><span>状态</span>
          </div>
          <div
            v-for="(item, index) in gauges.list"
            :key="item.bh || index"
            class="alarm-row gauge-row"
            :class="'gauge-' + item.status"
          >
            <span>{{ index + 1 }}</span
            ><span>{{ item.bh }}</span
            ><span>{{ item.mc }}</span
            ><span>{{ item.endDate }}</span
            ><span>{{ item.statusName }}</span>
          </div>
        </div>
        <div v-else class="empty">
          <img src="/legacy/no-data.png" alt="" />
          <div>当前无异常计量器具信息</div>
        </div>
      </section>
    </div>
    <nav class="menu">
      <button
        v-for="item in menus"
        :key="item.key"
        @click="dialogs?.openMenu(item)"
      >
        <span
          class="menu-image"
          :style="{ backgroundImage: `url('/legacy/${item.image}')` }"
          ><b v-if="item.count">{{ counts[item.count] ?? "" }}</b></span
        ><span :style="{ color: item.color }">{{ item.label }}</span>
      </button>
    </nav>
    <DashboardDialogs ref="dialogs" :counts="counts" :trains="trains" />
  </main>
</template>
