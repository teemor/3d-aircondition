<script setup>
import { toRefs } from "vue";
import DialogTable from "./DialogTable.vue";
// 设备信息弹窗：设备主卡、故障报修信息、今日任务工单。
const props = defineProps({ state: { type: Object, required: true } });
const { detailTab, detail, display, changeDeviceTab } = toRefs(props.state);
</script>

<template>
  <div v-if="detailTab === '设备主卡'" class="fields device-fields">
    <div
      v-for="field in [
        ['sbmc', '设备名称'],
        ['sbllid', '设备编号'],
        ['gzbh', '固资编号'],
        ['dwmc', '使用班组'],
        ['syrq', '始用日期'],
        ['sbyz', '设备原值'],
        ['zzcj', '设备厂家名称'],
        ['abcl', '设备级别'],
        ['sbxh', '设备型号'],
        ['jxxs', '机械系数'],
        ['dqxs', '电气系数'],
        ['gzbbc', '设备动态'],
        ['wxfs', '维修方式'],
        ['jszt', '技术等级'],
        ['xxzq', '检修周期'],
        ['bxr', '包机人'],
        ['bjr', '维修电工'],
        ['wxqg1', '维修钳工'],
        ['xxrq', '上次检修时间'],
      ]"
      :key="field[0]"
    >
      <span>{{ field[1] }}：</span>{{ display(detail[field[0]]) }}
    </div>
  </div>

  <DialogTable v-else :state="state" />
  <div class="device-tabs">
    <button
      v-for="name in ['设备主卡', '故障报修信息', '今日任务工单']"
      :key="name"
      :class="{ active: detailTab === name }"
      @click="changeDeviceTab(name)"
    >
      {{ name }}
    </button>
  </div>
</template>

