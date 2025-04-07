<template>
  <iframe class="file-viewer" :srcdoc="file.data" sandbox />
</template>

<script setup>
defineProps({
  file: { type: Object, required: true },
})
</script>

<style scoped>
.file-viewer {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
