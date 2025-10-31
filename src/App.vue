<script setup>
import { ref } from 'vue'
import Login from './components/Login.vue'
import MessageBoard from './components/MessageBoard.vue'

const user = ref(null)

function onLoginSuccess(u) {
  user.value = u
}
function onLogout() {
  user.value = null
}
</script>

<template>
  <div class="app-root">
    <div class="app-container">
      <Login v-if="!user" @login-success="onLoginSuccess" />
      <MessageBoard v-else :user="user" @logout="onLogout" />
    </div>
  </div>
</template>

<style scoped>
.app-root {
  min-height: 100vh;
  background: linear-gradient(180deg, #f4f7fb 0%, #eef2f6 100%);
}
.app-container {
  max-width: 860px;
  margin: 0 auto;
  padding: 32px 20px 56px;
}
</style>