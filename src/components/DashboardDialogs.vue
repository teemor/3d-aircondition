<script setup>
import { toRefs } from "vue";
import { useDialogs } from "../composables/useDialogs.js";
import BaseDialog from "./BaseDialog.vue";
import OverviewDialog from "./OverviewDialog.vue";
import DeviceDialog from "./DeviceDialog.vue";
import StepDetailDialog from "./StepDetailDialog.vue";
import WorkCardDialog from "./WorkCardDialog.vue";
import DialogTable from "./DialogTable.vue";
import FilePreviewDialog from "./FilePreviewDialog.vue";
const props = defineProps({ counts: Object, trains: Array });
const { counts, trains } = toRefs(props);
const state = useDialogs(counts, trains);
// 对外仅暴露业务入口，首页不再维护各弹窗内部字段。
defineExpose({
  openMenu: state.openMenu,
  openDevice: state.openDevice,
  openModelWork: state.openModelWork,
  openStep: state.openStep,
});
</script>
<template>
  <BaseDialog v-if="state.modal" :title="state.title" @close="state.close">
    <OverviewDialog v-if="state.modal === 'overview'" :state="state" />
    <DeviceDialog v-else-if="state.modal === 'device'" :state="state" />
    <StepDetailDialog v-else-if="state.modal === 'step'" :state="state" />
    <WorkCardDialog v-else-if="state.modal === 'card'" :state="state" />
    <DialogTable v-else :state="state" />
  </BaseDialog>
  <FilePreviewDialog
    v-if="state.previewFile"
    :file="state.previewFile"
    @close="state.previewFile = null"
  />
</template>
