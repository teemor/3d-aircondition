<script setup>
import { toRefs } from "vue";
import DialogTable from "./DialogTable.vue";
// 今日总览弹窗：全部、工单完成、作业中、待开工。
const props = defineProps({ state: { type: Object, required: true } });
const { tab, page, loadList, overviewCounts } = toRefs(props.state);
</script>

<template>
  <div class="dialog-tabs">
    <button
      v-for="entry in [
        ['all', '全部', 'all'],
        ['gdwc', '工单完成', 'ywc'],
        ['zyz', '作业中', 'zyz'],
        ['dkg', '待开工', 'dkg'],
      ]"
      :key="entry[0]"
      :class="{ active: tab === entry[0] }"
      @click="
        tab = entry[0];
        page = 1;
        loadList();
      "
    >
      {{ entry[1] }} ({{ overviewCounts[entry[2]] ?? 0 }})
    </button>
  </div>

  <DialogTable :state="state" />
</template>

