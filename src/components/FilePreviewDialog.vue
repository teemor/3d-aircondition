<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { attachmentUrl, fetchAttachment } from "../api/api.js";
const props = defineProps({ file: { type: Object, required: true } });
const emit = defineEmits(["close"]);
const officePreview = ref(null);
const previewError = ref("");
const previewFile = computed(() => props.file);
// 附件预览：图片/PDF 直接展示，Excel 和 Word 使用原项目预览库。
watch(
  () => props.file,
  async (file) => {
    previewError.value = "";
    await nextTick();
    const target = officePreview.value;
    if (target) target.replaceChildren();
    try {
      if (/\.xlsx(\?|$)/i.test(file.fdNqlj || "")) {
        await window.jsPreviewExcel
          .init(target)
          .preview(attachmentUrl(file.fdNqlj));
      } else if (/\.docx(\?|$)/i.test(file.fdNqlj || "")) {
        // 原 vue.js：重要：将响应类型设置为 'blob'。Word 渲染必须使用二进制附件。
        const blob = await fetchAttachment(file.fdNqlj);
        if (props.file === file) await window.docx.renderAsync(blob, target);
      }
    } catch (err) {
      if (props.file === file)
        previewError.value = "预览失败：" + (err.message || err);
    }
  },
  { immediate: true },
);
</script>
<template>
  <div class="preview-overlay" @click.self="emit('close')">
    <section class="preview-dialog">
      <header>
        <strong>{{ previewFile.fdYmcq || "文件预览" }}</strong
        ><button @click="emit('close')" aria-label="关闭预览">×</button>
      </header>
      <img
        v-if="/\.(png|jpe?g|gif|webp)(\?|$)/i.test(previewFile.fdNqlj)"
        :src="attachmentUrl(previewFile.fdNqlj)"
        alt="附件预览"
      /><iframe
        v-else-if="/\.pdf(\?|$)/i.test(previewFile.fdNqlj)"
        :src="attachmentUrl(previewFile.fdNqlj)"
        title="文件预览"
      ></iframe
      ><template v-else-if="/\.(xlsx|docx)(\?|$)/i.test(previewFile.fdNqlj)"
        ><div v-if="previewError" class="notice">{{ previewError }}</div>
        <div ref="officePreview" class="office-preview"></div
      ></template>
      <div v-else class="notice">
        该文件格式请下载后查看
        <a
          :href="attachmentUrl(previewFile.fdNqlj)"
          download
          target="_blank"
          rel="noopener"
          >下载文件</a
        >
      </div>
    </section>
  </div>
</template>
<style scoped>
.office-preview {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: white;
  color: #222;
}
</style>
