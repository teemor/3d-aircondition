<script setup>
// 统一弹窗外框；保留旧页面的遮罩、标题和关闭按钮样式。
defineProps({ title: String });
defineEmits(["close"]);
</script>
<template>
  <div class="overlay" @click.self="$emit('close')">
    <section class="dialog">
      <header class="dialog-header">
        <h2>{{ title }}</h2>
        <button title="关闭" aria-label="关闭" @click="$emit('close')">
          ×
        </button>
      </header>
      <slot />
    </section>
  </div>
</template>
