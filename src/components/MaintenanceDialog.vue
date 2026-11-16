<script setup>
import { toRefs } from "vue";
import DialogTable from "./DialogTable.vue";

// 机辆检修记录（原 dialog.js recordDialog）：今日直接查询，历史按日期区间查询。
const props = defineProps({ state: { type: Object, required: true } });
const { maintenanceTab, maintenanceRange, changeMaintenanceTab, searchMaintenance } =
  toRefs(props.state);
</script>

<template>
  <div class="maintenance">
    <div class="maintenance-bar">
      <button
        :class="{ active: maintenanceTab === 'today' }"
        @click="changeMaintenanceTab('today')"
      >
        今日
      </button>
      <button
        :class="{ active: maintenanceTab === 'history' }"
        @click="changeMaintenanceTab('history')"
      >
        历史
      </button>
      <template v-if="maintenanceTab === 'history'">
        <input v-model="maintenanceRange[0]" type="date" />
        <span>至</span>
        <input v-model="maintenanceRange[1]" type="date" />
        <button class="maintenance-search" @click="searchMaintenance()">查询</button>
      </template>
    </div>
    <DialogTable :state="state" />
  </div>
</template>

<style scoped>
.maintenance {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
}
.maintenance-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 15px 24px 0;
}
.maintenance-bar button {
  padding: 4px 14px;
  border: 1px solid #0a6f9e;
  background: transparent;
  color: #9fd6f2;
  cursor: pointer;
}
.maintenance-bar button.active {
  border-color: #17f8f5;
  color: #fff;
  background: rgba(23, 248, 245, 0.14);
}
.maintenance-search {
  margin-left: 4px;
}
.maintenance-bar input {
  padding: 3px 6px;
  border: 1px solid #0a6f9e;
  background: rgba(0, 30, 49, 0.86);
  color: #cfe9f7;
  color-scheme: dark;
}
</style>
