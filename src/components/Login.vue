<template>
  <div class="card">
    <h2 class="card-title" v-if="mode === 'login'">登录</h2>
    <h2 class="card-title" v-else>注册新用户</h2>

    <form class="form" @submit.prevent="mode === 'login' ? onLogin() : onRegister()">
      <div class="form-item">
        <label>用户名</label>
        <input v-model="username" required maxlength="20" placeholder="请输入用户名" />
      </div>
      <div class="form-item">
        <label>密码</label>
        <input v-model="password" type="password" required maxlength="20" placeholder="请输入密码" />
      </div>
      <button class="btn primary" type="submit">{{ mode === 'login' ? '登录' : '注册' }}</button>
    </form>

    <div class="muted">
      <a href="#" @click.prevent="toggleMode">
        {{ mode === 'login' ? '没有账号？注册新用户' : '已有账号？去登录' }}
      </a>
    </div>
    <div v-if="error" class="msg err">{{ error }}</div>
    <div v-if="successMsg" class="msg ok">{{ successMsg }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const emits = defineEmits(['login-success'])

const username = ref('')
const password = ref('')
const error = ref('')
const successMsg = ref('')
const mode = ref('login') // login or register

const onLogin = async () => {
  error.value = ''
  successMsg.value = ''
  const res = await fetch('http://localhost:3030/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Username: username.value, Password: password.value })
  })
  const data = await res.json()
  if (data.success && data.user) {
    emits('login-success', data.user)
  } else {
    error.value = data.message || '登录失败'
  }
}

const onRegister = async () => {
  error.value = ''
  successMsg.value = ''
  const res = await fetch('http://localhost:3030/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Username: username.value, Password: password.value })
  })
  const data = await res.json()
  if (data.success) {
    successMsg.value = '注册成功，请登录'
    username.value = ''
    password.value = ''
    setTimeout(() => {
      mode.value = 'login'
      successMsg.value = ''
    }, 1200)
  } else {
    error.value = data.message || '注册失败'
  }
}

const toggleMode = () => {
  error.value = ''
  successMsg.value = ''
  mode.value = mode.value === 'login' ? 'register' : 'login'
}
</script>

<style scoped>
.card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #eaecef;
  box-shadow: 0 10px 30px rgba(0,0,0,0.04);
  padding: 24px 20px 20px;
}
.card-title {
  margin: 0 0 16px;
  font-size: 22px;
  font-weight: 700;
  color: #1f2328;
}
.form-item { margin-bottom: 14px; }
.form-item label {
  display: block;
  font-size: 13px;
  color: #6a737d;
  margin-bottom: 6px;
}
input {
  width: 100%;
  height: 38px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid #d0d7de;
  background: #fff;
  outline: none;
  transition: border-color .2s, box-shadow .2s;
}
input:focus { border-color: #409eff; box-shadow: 0 0 0 3px rgba(64,158,255,.15); }

.btn {
  height: 38px;
  padding: 0 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: transform .05s ease, box-shadow .2s;
}
.btn:active { transform: translateY(1px); }
.primary {
  background: #409eff;
  color: #fff;
  box-shadow: 0 6px 18px rgba(64,158,255,.25);
}
.primary:hover { filter: brightness(1.03); }

.muted { margin-top: 10px; font-size: 13px; }
.muted a { color: #409eff; text-decoration: none; }
.muted a:hover { text-decoration: underline; }

.msg { margin-top: 8px; font-size: 13px; }
.err { color: #d03050; }
.ok { color: #2f9e44; }
</style>
