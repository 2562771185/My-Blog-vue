<template>
  <div id="navbar">
    <nav id="main-menubar" class="main-menubar-color">
      <div id="menu-header">
        <router-link class="profile" v-if="!$store.state.isLogin"
                     :to="$store.state.isLogin ? '/profile?account=' + this.profile.account : '/login'">
          <img onload="this.style.opacity = 1"
               src="https://pro-file.xiaoheiban.cn/ddw/e1ec7329-6dc5-4927-a763-bac064f9a311.svg" class="logo"
               alt="avatar">
          <span id="name">{{ $store.state.isLogin ? this.profile.nickname : $store.state.blogName }}</span>
        </router-link>
        <router-link class="profile" v-if="$store.state.isLogin"
                     :to="$store.state.isLogin ? '/profile?account=' + this.profile.account : '/login'">
          <img onload="this.style.opacity = 1" @error="imgError('avatar')" :src="this.profile.avatar" class="logo"
               alt="avatar">
          <span id="name1">{{ $store.state.isLogin ? this.profile.nickname : $store.state.blogName }}</span>
        </router-link>
      </div>
      <div class="menu-btn" v-bind:class="menu_open" @click="isMenuOpen">
        <div class="menu-btn__burger"></div>
      </div>
      <ul :class="menu_open" id="menu-items">
        <div id="mobile_logo_container">
          <router-link @click="this.closeMenu()" class="profile"
                       :to="$store.state.isLogin ? '/profile?account=' + profile.account : '/login'">
            <img @click="closeMenu" onload="this.style.opacity = 1" @error="imgError('avatar')"
                 :src="profile.avatar" :class="'logo ' + menu_open" alt="avatar">
          </router-link>
          <router-link class="profile" :to="$store.state.isLogin ? '/profile?account=' + profile.account : '/login'">
            <span @click="closeMenu" id="username">{{
                $store.state.isLogin ? $store.state.profile.nickname : $store.state.blogName
              }}</span>
          </router-link>
        </div>
        <div id="search" :class="search_open" @mousedown="isSearchOpen()">
          <div id="search-box" @mousedown="isSearchOpen()">
            <div id="search-title">文章搜索</div>
            <div id="search-content">
              <input v-model="searchValue" name="search_input" class="search_input" type="text"
                     placeholder="输入你想查阅的内容..." @keydown.enter="search"/>
              <div @click="search" id="search-btn">
                <font-awesome-icon :icon="['fas', 'search']"/>
              </div>
            </div>
          </div>
        </div>
        <router-link to="/" tag="a">
          <li @click="closeMenu">
            <font-awesome-icon class="menu-icon" :icon="['fas', 'home']"/>
            主页
          </li>
        </router-link>
        <a href="javascript:void(0)" @click="logoutAndLogin($store.state.isLogin)">
          <li>
            <font-awesome-icon class="menu-icon" :icon=" ['fas', 'user']"/>
            {{ $store.state.isLogin ? '登出' : '登录' }}
          </li>
        </a>
        <a>
          <li @click="isSearchOpen()">
            <font-awesome-icon class="menu-icon" :icon=" ['fas', 'search']"/>
            搜索
          </li>
        </a>
      </ul>
      <black-mask @click.native="closeMenu" class="menubar-mask" :active="menu_open"></black-mask>
    </nav>
  </div>
</template>

<script>
import BlackMask from '@/components/BlackMask'
import { BlogConfig } from '@/config/blog.config'
import cookie from 'vue-cookie'

export default {
  name: 'Navbar',
  data: function () {
    return {
      menu_open: 'close',
      viewport_width: 0,
      search_open: '',
      searchValue: '',
      profile: {
        nickname: null,
        account: null,
        avatar: null
      }
    }
  },
  created() {
    window.addEventListener('resize', this.handleResize)
    this.handleResize()
    document.body.style.padding = '74px 0 0 0'
    this.profile = this.$store.state.profile
    console.log('this.profile',this.profile)
  },
  beforeDestroy: function () {
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    logoutAndLogin(isLogin) {
      if (isLogin) {
        this.$store.commit('logout')
        location.reload()
      } else {
        this.Login()
      }

    },
    isMenuOpen() {
      this.menu_open === 'open' ? this.menu_open = 'close' : this.menu_open = 'open'
    },
    closeMenu() {
      this.menu_open = 'close'
    },
    isSearchOpen() {
      this.closeMenu()
      this.search_open === '' ? this.search_open = 'search-active' : this.search_open = ''
    },
    handleResize(event) {
      this.viewport_width = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
    },
    Login() {
      const token = localStorage.getItem(BlogConfig.tokenName)
      if (token !== null) {
        localStorage.removeItem(BlogConfig.tokenName)
        location.reload()
      } else {
        this.$router.push('/login')
      }
    },
    imgError(type) {
      if (type === 'avatar') {
        this.profile.avatar = BlogConfig.defaultAvatar
        this.$store.state.profile.avatar = BlogConfig.defaultAvatar
      }
    },
    async search() {
      try {
        if (this.searchValue !== '') {
          await this.$router.push({
            query: { search: this.searchValue }
          })
        } else {
          await this.$router.push({
            query: {}
          })
        }
      } catch (e) {
        console.log(e.message)
      }
      this.isSearchOpen()
      this.searchValue = ''
    }
  },
  components: {
    BlackMask
  },
  watch: {
    '$store.state.profile': {
      deep: true,
      handler: function (newValue, oldValue) {
        if (newValue !== null) {
          this.profile = newValue
        }
      }
    }
  }
}
</script>

<style lang="sass">
@import "src/assets/style/components/Navbar"
</style>
