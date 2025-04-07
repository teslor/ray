<template>
  <el-popover
    v-model:visible="isVisible"
    :popper-options="{ modifiers: [{ name: 'offset', options: { offset: [0, 0] } }] }"
    :popper-style="selectorStyle"
    :show-arrow="false"
    popper-class="color-selector"
    placement="bottom-start"
    trigger="click"
  >
    <template #reference>
      <el-button size="small" :icon="ArrowDown" class="arrow-button" />
    </template>
    <div
      v-for="color in [...colors, '']"
      :key="color"
      :class="['color-tile', { 'is-active': activeColor === color}]"
      :style="color ? { backgroundColor: color } : {}"
      @click="selectColor(color)"
    >
      <icon-x v-if="!color" :size="18" />
    </div>
  </el-popover>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import IconX from '@tabler-icons/IconX.mjs'

const props = defineProps({
  activeColor: { type: String, default: '' },
  colors: { type: Array, required: true },
  rowLength: { type: Number, default: 6 }
})
const emit = defineEmits(['select'])

const isVisible = ref(false)

const selectorStyle = computed(() => ({ width: `${props.rowLength * 1.25 + 0.25 * (props.rowLength + 1)}em` }))

function selectColor(color) {
  isVisible.value = false
  if (color !== props.activeColor) emit('select', color)
}
</script>

<style scoped>
.color-tile {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  cursor: pointer;
  width: 1.25em;
  height: 1.25em;
  margin-right: 0.25em;
  margin-bottom: 0.25em;
  border: 1px solid var(--ui-border-color);
  text-align: center;

  &.is-active {
    border: 1px solid var(--ui-color-primary);
  }
}

.arrow-button {
  padding: 0;
  color: var(--element-placeholder-color);
}
</style>

<style>
.color-selector.el-popover.el-popper {
  border: none;
  font-size: 1rem;
  padding: 0.25em 0 0 0.25em;
  display: flex;
  flex-wrap: wrap;
  min-width: 0;
}
</style>
