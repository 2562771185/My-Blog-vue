<template>
  <div id="login-container">
    <div id="account-box" :class="isRegisterActive">
      <div id="login-tips">注册点这里...</div>
      <div @click="changeRegisterActive" id="show-register-box"
           :title="isRegisterActive === '' ? 'Register' : 'Login' ">
        <font-awesome-icon v-if="this.isRegisterActive === ''" class="menu-icon login" :icon="['fas', 'user-circle']"/>
        <font-awesome-icon v-if="this.isRegisterActive === 'register-active'" class="menu-icon register"
                           :icon="['fas', 'times']"/>
      </div>
      <!--Login UI-->
      <router-link tag="span" to="/" id="back-to-home">
        <font-awesome-icon :icon="['fas', 'arrow-left']"/>
      </router-link>
      <div id="login-box">
        <div id="login-title">登录</div>
        <div id="login-form">
          <div id="login-username">
            用户名<br/>
            <input v-model="username" type="text">
          </div>
          <div id="login-password">
            密码<br/>
            <input v-model="password" type="password">
          </div>
          <div id="login-captcha">
            验证码<br/>
            <input @keypress.enter="login" v-model="captchaKey" type="text">
            <img @click="refreshCaptchaKey" :src="codeUrl" alt="" class="captcha-img">
          </div>
          <div id="pw-group">
            <!--            <span><el-checkbox id="remember">REMEMBER ME</el-checkbox></span>-->
            <br><br>
            <span><input type="checkbox" id="remember" ref="remember" name="remember"><label for="remember">记住我</label></span>
<!--            <router-link tag="a" to="/pwd">忘记密码?</router-link>-->
            <router-link tag="a" to="/">返回主页</router-link>
          </div>
          <button id="login-button" @click="login">登录</button>
        </div>
      </div>
      <!--Register UI-->
      <div :class="isRegisterActive" id="register-box">
        <div id="register-title">注册</div>
        <div id="register-form">
          <div id="register-username">
            账号 (不可修改)<br/>
            <input v-model="username" id="reg-name" type="text">
            <label for="reg-name"><span>长度3-8且必须包含大写或小写字母,可包含数字或下划线</span></label>
          </div>
          <div id="register-nickname">
            昵称<br/>
            <input v-model="nickname" id="" type="text">
          </div>
          <div id="register-password">
            密码<br/>
            <input v-model="password" id="reg-password" type="password">
            <label for="reg-password"><span>长度6-16且必须包含以下2种组合(0-9,A-Z,a-z,@#$%^&*?+_)</span></label>
          </div>
          <div id="register-email">
            邮箱<br/>
            <input v-model="email" id="reg-email" type="text">
          </div>
          <div id="register-captcha">
            验证码<br/>
            <input @keypress.enter="register" v-model="captchaKey" type="text">
            <img @click="refreshCaptchaKey" :src="codeUrl" alt="" class="captcha-img">
          </div>
        </div>
        <button @click="register" id="register-button">注册</button>

      </div>
    </div>
  </div>
</template>

<script>
import captchaKey from '@/components/captchaKey'
import { BlogConfig } from '@/config/blog.config'
import cookie from 'vue-cookie'

export default {
  name: 'Login',
  data() {
    return {
      BlogConfig,
      isRegisterActive: '',
      captchaKey: '',
      username: '',
      password: '',
      email: '',
      codeUrl: '',
      uuid: '',
      nickname:''
    }
  },
  methods: {
    getCode() {
      //删除刷新之前的验证码
      if (this.uuid != ''){
        this.$post(`/delCaptcha?uuid=${this.uuid}` )
      }
      this.$get('/captchaImage').then(res => {
        this.codeUrl = 'data:image/gif;base64,' + res.img
        this.uuid = res.uuid
      })
    },
    changeRegisterActive() {
      this.isRegisterActive = this.isRegisterActive === '' ? 'register-active' : ''
      this.refreshCaptchaKey()
      this.captchaKey = ''
      this.username = ''
      this.password = ''
    },
    //刷新验证码
    refreshCaptchaKey() {
      this.captchaKey = ''
      if (this.isRegisterActive === '') {
        console.log("登录界面刷新验证码")
        this.getCode()
      } else {
        console.log("注册界面刷新验证码")
        this.getCode()
      }
    },
    async login() {
      const captchaKey = this.captchaKey
      const res = await this.$post('user/login', {
        account: this.username,
        password: this.password,
        captchaKey,
        uuid: this.uuid
      })
      console.log('login',res)
      this.refreshCaptchaKey()
      if (res.code === 200) {
        console.log('token存入localStorage')
        localStorage.setItem(BlogConfig.tokenName,res.data.token)
        //更新最新个人信息
        this.$store.commit('updateLoginState')
        this.$noty.success(res.msg, {
          killer: true
        })
      } else {
        this.$noty.error(res.msg, {
          killer: true
        })
      }
      await this.$router.push('/')

    },
    async register() {
      const res = await this.$post('user/register', {
        account: this.username,
        nickname: this.nickname,
        password: this.password,
        email: this.email,
        captchaKey: this.captchaKey,
        uuid: this.uuid
      })
      this.refreshCaptchaKey()
      if (res.code == 200) {
        this.$noty.success(res.msg, {
          killer: true
        })
        this.isRegisterActive = ''
      } else {
        this.$noty.error(res.msg, {
          killer: true
        })
      }
    }
  },
  mounted() {
    document.title = `登录 - ${this.BlogConfig.blogName}`
    // this.refreshCaptchaKey()
    // const rememberUser = JSON.parse(window.localStorage.getItem('account'))
    // if (rememberUser !== null) {
    //   this.$refs.remember.checked = true
    //   this.username = rememberUser.account
    // }
  },
  components: {
    captchaKey
  },
  created() {
    this.getCode()
  }
}
</script>

<style scoped lang="sass">
@import "src/assets/style/views/Login"
</style>
