<script setup>
import { toRefs } from "vue";
import { attachmentUrl } from "../api/api.js";
// 今日总览明细检查卡片：附件、记录表图例和检查项。
const props = defineProps({ state: { type: Object, required: true } });
const { detail, cardIndex, preview, display } = toRefs(props.state);
</script>

<template>
  <div class="card-content">
    <div v-if="detail.length" class="card-navigation">
      <button :disabled="cardIndex === 0" @click="cardIndex--">上一张</button
      ><span>{{ cardIndex + 1 }} / {{ detail.length }}</span
      ><button :disabled="cardIndex >= detail.length - 1" @click="cardIndex++">
        下一张
      </button>
    </div>
    <section v-if="detail[cardIndex]">
      <h3>{{ detail[cardIndex].jckpTitle }}</h3>
      <div class="attachment-groups">
        <div
          v-for="group in [
            ['mroFjDetailList', '空调机组检修附件'],
            ['jckpAttachmentList', '空调机组检修记录表图例'],
          ]"
          :key="group[0]"
        >
          <h4>{{ group[1] }}</h4>
          <div
            v-for="file in detail[cardIndex][group[0]] || []"
            :key="file.fdNqlj"
            class="attachment"
          >
            <span>{{ file.fdYmcq || file.fdNqlj }}</span
            ><button class="link" @click="preview(file)">预览</button
            ><a
              :href="attachmentUrl(file.fdNqlj)"
              download
              target="_blank"
              rel="noopener"
              >下载</a
            >
          </div>
          <p v-if="!detail[cardIndex][group[0]]?.length">暂无附件</p>
        </div>
      </div>
      <div
        v-for="(entry, i) in detail[cardIndex].jcxdVos || []"
        :key="i"
        class="card-row"
      >
        <b>{{ entry.jcxdName }}</b
        ><span
          v-for="n in 5"
          :key="n"
          v-show="entry['jcxdTitle' + n] || entry['jcxdMrz' + n]"
          >{{ entry["jcxdTitle" + n] }}：{{
            display(entry["jcxdMrz" + n])
          }}</span
        >
      </div>
    </section>
    <div v-else class="empty">暂无检查卡片</div>
  </div>
</template>

