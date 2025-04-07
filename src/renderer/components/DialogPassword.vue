<template>
  <el-dialog
    v-model="showDialog"
    class="dialog-password"
    :title="`${action} File`"
    width="90%"
    align-center
    :close-on-click-modal="false"
    @opened="handleDialogOpened"
    @close="handleDialogClose"
    @keyup.enter="proceed"
  >
    <label class="label" for="password">
      Secret phrase to {{ action.toLowerCase() }} file <span class="file">{{ fileName }}</span>:
    </label>
    <el-input
      ref="passwordInput"
      v-model="password"
      name="password"
      :type="showPassword ? '' : 'password'"
    >
      <template #append>
        <el-button @click="togglePasswordVisibility">
          <component :is="showPassword ? IconEye : IconEyeOff" :size="24" :stroke="1.5" />
        </el-button>
      </template>
    </el-input>
    <div class="buttons">
      <el-button @click="showDialog = false">Cancel</el-button>
      <el-button type="primary" :disabled="!password.length" @click="proceed">OK</el-button>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, useTemplateRef, watch } from 'vue'
import { useStore } from 'vuex'
import IconEye from '@tabler-icons/IconEye.mjs'
import IconEyeOff from '@tabler-icons/IconEyeOff.mjs'
const { state } = useStore()

let shouldProceed = false
let resolver = null

const passwordInputRef = useTemplateRef('passwordInput')
const showDialog = ref(false)
const showPassword = ref(false)
const action = ref('')
const fileName = ref('')
const password = ref('')

watch(() => state.bus.modal, (message) => {
  if (message.text !== 'password') return
  resolver = message.resolver
  action.value = message.action
  fileName.value = message.fileName
  setTimeout(() => { showDialog.value = true })
})

function handleDialogOpened() {
  passwordInputRef.value.focus()
}

async function handleDialogClose() {
  resolver(shouldProceed ? password.value : '')
  shouldProceed = false
  resolver = null
  showPassword.value = false
  password.value = ''
}

function togglePasswordVisibility() {
  showPassword.value = !showPassword.value
  passwordInputRef.value.focus()
}

function proceed() {
  shouldProceed = true
  showDialog.value = false
}
</script>

<style scoped>
.label {
  display: block;
  margin-bottom: 6px;
}

.file {
  color: var(--ui-color-accent);
}

.buttons {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
}
</style>

<style>
.dialog-password {
  max-width: 460px;
  padding: 12px !important;

  .el-dialog__header {
    padding-right: 28px;
    padding-bottom: 12px;
  }

  .el-dialog__headerbtn {
    width: 40px;
    height: 40px;
  }

  .el-dialog__body {
    padding: 0;
  }

  .el-input-group__append .el-button {
    display: flex;
    padding: 0;
  }
}
</style>
