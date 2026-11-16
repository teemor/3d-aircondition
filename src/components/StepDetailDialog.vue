<script setup>
import { toRefs } from "vue";

// 过程节拍总览：车组、工序、作业明细和异常明细。
const props = defineProps({ state: { type: Object, required: true } });
const { trains, selectedTrain, selectedStep, steps, openStep, tab, stepDetail, display, cardList, openCard, exceptions } = toRefs(props.state);
</script>

<template>
  <div class="step-detail">
    <div class="dialog-tabs">
      <button
        v-for="train in trains"
        :key="train.czh"
        :class="{ active: selectedTrain === train.czh }"
        @click="
          openStep(
            train,
            steps.find((s) => s.name === selectedStep),
          )
        "
      >
        {{ train.czh }}
      </button>
    </div>
    <div class="dialog-tabs">
      <button
        v-for="step in steps"
        :key="step.key"
        :class="{ active: selectedStep === step.name }"
        @click="
          openStep(
            trains.find((x) => x.czh === selectedTrain),
            step,
          )
        "
      >
        {{ step.name }}
      </button>
    </div>
    <div class="dialog-tabs">
      <button :class="{ active: tab === 'work' }" @click="tab = 'work'">
        作业明细</button
      ><button
        :class="{ active: tab === 'exceptions' }"
        @click="tab = 'exceptions'"
      >
        异常明细
      </button>
    </div>
    <div v-if="tab === 'work'" class="fields">
      <div
        v-for="field in [
          ['rwgdCzh', '车组号'],
          ['rwgdCode', '工单号'],
          ['rwgdMs', '作业内容'],
          ['rwgdStatus', '任务状态'],
          ['rwgdSjks', '开工时间'],
          ['rwgdSjjs', '完工时间'],
          ['zyry', '作业人员'],
        ]"
        :key="field[0]"
      >
        <span>{{ field[1] }}：</span>{{ display(stepDetail[field[0]]) }}
      </div>
      <div>
        检查卡片：<button
          v-for="card in cardList"
          :key="card.jckpTitle"
          class="link"
          @click="openCard(card.glgd || stepDetail.rwgdCode)"
        >
          {{ card.jckpTitle }}
        </button>
      </div>
    </div>
    <div v-else class="exception-groups">
      <div
        v-for="group in [
          ['jpCs', '节拍超时'],
          ['dlYc', '待料异常'],
          ['scYc', '生产异常'],
        ]"
        :key="group[0]"
      >
        <h3>{{ group[1] }}</h3>
        <div v-for="(entry, index) in exceptions[group[0]] || []" :key="index">
          {{ entry.latestDesc || entry.wlName || entry.errorDescribe || "--" }}
        </div>
        <p v-if="!exceptions[group[0]]?.length">暂无数据</p>
      </div>
    </div>
  </div>
</template>

