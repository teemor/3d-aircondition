<script setup>
import { toRefs } from "vue";

// 作业及异常列表共用表格，保留原分页和检查项入口。
const props = defineProps({ state: { type: Object, required: true } });
const { busy, error, columns, modal, tab, detailTab, rows, page, display, openCard, total, setPage } = toRefs(props.state);
</script>

<template>
  <div class="table-area">
    <div v-if="busy" class="notice">加载中...</div>
    <div v-else-if="error" class="notice">{{ error }}</div>
    <div v-else class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>序号</th>
            <th v-for="col in columns" :key="col[0]">{{ col[1] }}</th>
            <th
              v-if="
                ['working', 'timeout', 'modelWork'].includes(modal) ||
                (modal === 'device' && detailTab === '今日任务工单') ||
                (modal === 'overview' && tab !== 'all')
              "
            >
              检查项
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in rows" :key="row.id || index">
            <td>{{ (page - 1) * 10 + index + 1 }}</td>
            <td v-for="col in columns" :key="col[0]">
              {{ display(row[col[0]]) }}
            </td>
            <td
              v-if="
                ['working', 'timeout', 'modelWork'].includes(modal) ||
                (modal === 'device' && detailTab === '今日任务工单') ||
                (modal === 'overview' && tab !== 'all')
              "
            >
              <button class="link" @click="openCard(row.rwgdCode)">查看</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!rows.length" class="empty">
        <img src="/legacy/no-data.png" alt="" />
        <div>暂无数据</div>
      </div>
    </div>
    <div
      v-if="total > 10 && !(modal === 'overview' && tab === 'all')"
      class="pagination"
    >
      <button :disabled="page <= 1" @click="setPage(page - 1)">上一页</button
      ><span>{{ page }} / {{ Math.ceil(total / 10) }}</span
      ><button :disabled="page * 10 >= total" @click="setPage(page + 1)">
        下一页</button
      ><span>共 {{ total }} 条</span>
    </div>
  </div>
</template>

