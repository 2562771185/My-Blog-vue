<template>
  <base-layout>
    <div @mousemove="move($event)" id="profile-container">
      <div id="header">
        <div id="header-edit" ref="headerEditor" :class="isProfileEditorActive" v-if="isMe">
          <div id="header-edit-btn" @click="openProfileEditor">
            <font-awesome-icon v-if="isProfileEditorActive === 'disable'" class="menu-icon login"
                               :icon="['fas', 'pen']"/>
            <font-awesome-icon v-else class="menu-icon close" :icon="['fas', 'times']"/>
          </div>
          <div id="edit-container">
            <div id="edit-container-title">更改资料</div>
            <div :style="'background-image: url(\'' + bannerImg +'\')'" @click="beforeUpload('banner_img')"
                 class="edit-container-item header-banner">
              <div class="black-mask">
                <input @change="upload($event,'banner_img')" v-show="false" ref="bannerIMG" class="file" name="file"
                       type="file" accept="image/png,image/gif,image/jpeg"/>
                <div class="icon-container">
                  <font-awesome-icon class="icon-upload" :icon="['fas', 'arrow-circle-up']"/>
                </div>
                更改背景图
              </div>
            </div>
            <div :style="'background-image: url(\'' + avatarImg +'\')'" class="edit-container-item header-avatar"
                 @click="beforeUpload('avatar_img')">
              <div class="black-mask">
                <input @change="upload($event,'avatar_img')" v-show="false" ref="avatarIMG" class="file" name="file"
                       type="file" accept="image/png,image/gif,image/jpeg"/>
                <div>
                  <font-awesome-icon class="menu-icon icon-upload" :icon="['fas', 'camera']"/>
                </div>
              </div>
            </div>
            <div class="edit-container-item username">
              <input :value="profile.nickname" ref="nickname" type="text"><br/>
              <span class="edit-container-tips">*仅支持10位英文/数字/下划线组成的字符</span><br/>
              <button @click="updateNickname">保存更改</button>
            </div>
            <div class="edit-container-item password">
              <span>修改密码</span>
              <button @click="changePassword">发送验证邮件</button>
            </div>
            <div class="edit-container-item password">
              <span>更改邮箱</span>
              <div id="change-email">
                <span v-if="profile.email === 0">*您的邮箱还未验证,如果邮箱有误请修改</span>
                <input class="readonly" v-if="profile.email === 1" type="text" :value="profile.email" readonly>
                <input v-else type="text" v-model="email">
                <button @click="changeEmail">发送验证邮件</button>
              </div>
            </div>
          </div>
        </div>
        <img @error="imgError('banner')" id="banner" :style="'transform:' + imgTransform"
             :src="bannerImg" height="1080" width="1920"
             alt="header"/>
        <div @click="openProfileEditor" id="avatar">
          <img onload="this.style.opacity = 1" @error="imgError('avatar')"
               :src="profile.avatar"/>
          <div v-if="isMe" id="avatar-edit">
            <font-awesome-icon class="menu-icon login" :icon="['fas', 'pen']"/>
          </div>
        </div>
      </div>
      <div id="user">
        <div id="nickname">{{ profile.nickname }}</div>
        <div id="username" v-if="profile.account !== undefined">{{ profile.account }}</div>
      </div>
      <hr>
      <div id="content">
        <div id="post-title">
          <span>文章列表</span>
          <router-link v-if="isMe" tag="span" to="/postedit/new" id="post-add">
            <font-awesome-icon class="menu-icon login" :icon="['fas', 'plus']"/>
          </router-link>
        </div>
        <div id="void-content" v-show="postIsNull">{{ $route.query.search ? '没有搜索到匹配的文章' : '还没有任何文章哦~' }}</div>
        <div id="posts">
          <div v-for="(value, index) in post" :key="index" class="post">
            <div v-if="isMe" class="post-option">
              <span @click="$router.push('/postedit/' + value.id)" class="post-edit"><font-awesome-icon
                class="menu-icon login" :icon="['fas', 'pen']"/></span>
              <span @click="setConfirmStatus('active', value.id)" class="post-delete"><font-awesome-icon
                class="menu-icon login" :icon="['fas', 'trash']"/></span>
            </div>
            <div class="post-title">
              <router-link :style="isMe ? '' : 'max-width: 100%;'" :to="/post/ + value.id">{{
                  value.title
                }}
              </router-link>
            </div>
            <div class="post-detail">
            <span class="post-time">
              <font-awesome-icon class="menu-icon login" :icon="['fas', 'clock']"/>
              {{ value.gmtCreate }}
            </span>
              <span class="post-author">
              <font-awesome-icon class="menu-icon login" :icon="['fas', 'user-circle']"/>
              {{ value.authorNickname }}
            </span>
            </div>
            <hr>
            <div class="post-context" v-html="value.summary"></div>
            <div class="post-footer">
              <router-link :to="/post/ + value.id" class="post-more">阅读全文
                <font-awesome-icon class="menu-icon login" :icon="['fas', 'angle-right']"/>
              </router-link>
            </div>
          </div>
        </div>
        <div id="content-footer">
          <page-button v-show="!postIsNull" :maxpage="page_count"></page-button>
        </div>
      </div>
      <black-mask :class="isProfileEditorActive" @click.native="openProfileEditor"></black-mask>
      <confirm-dialog :id="postCursor" :setpost="setupPost" @status="setConfirmStatus" :class="isDeletePostActive">
        <template v-slot:title>删除文章</template>
        <template v-slot:content>即将永久移除该文章,确定删除吗?</template>
      </confirm-dialog>
      <black-mask @click.native="setConfirmStatus('disable')" :class="isDeletePostActive"></black-mask>
    </div>
  </base-layout>
</template>

<script>
import PageButton from '@/components/PageButton'
import ConfirmDialog from '@/components/DelPost'
import BlackMask from '@/components/BlackMask'
import { BlogConfig } from '@/config/blog.config'
import BaseLayout from '@/components/BaseLayout'
import axios from 'axios'
import cookie from 'vue-cookie'

const profileUpload = require('@/network/profileUpload')
export default {
  name: 'profile',
  data() {
    return {
      BlogConfig,
      imgTransform: '555',
      email: null,
      profile: {
        id: '',
        account: '',
        nickname: '',
        avatar: '',
        bannerImg: ''
      },
      isProfileEditorActive: 'disable',
      bannerImg: '',
      avatarImg: null,
      isMe: false,
      page_count: 0,
      post: [],
      isDeletePostActive: 'disable',
      postCursor: null,
      queryParam: {
        page: 1,
        account: this.$route.query.account
      }
    }
  },
  computed: {
    postIsNull: function () {
      return (this.post === null || this.post.length <= 0)
    }
  },
  methods: {
    move(event) {
      // if (document.documentElement.scrollTop > 300) return
      // const horizontal = event.clientX / parseInt(getComputedStyle(document.querySelector('#profile-container')).width, 10)
      // const vertical = event.clientY / parseInt(getComputedStyle(document.querySelector('#profile-container')).width, 10)
      // this.imgTransform = this.calculateTransform(horizontal, vertical, 15)
    },
    calculateTransform(horizontal, vertical, offset) {
      return `translate(calc(${horizontal * offset / 0.5}px - 50%), calc(${vertical * offset / 0.5}px - 50%))`
    },
    //查询个人信息主页
    setupProfile() {
      this.$get(`user/profile/?account=${this.$route.query.account}`).then(res => {
        if (res.code == 200) {
          this.profile = res.data
          this.email = res.data.email
          this.bannerImg = res.data.bannerImg
          this.avatarImg = res.data.avatar
          document.title = `${this.profile.nickname} - 个人主页`
          this.$noty.success(res.msg, {
            killer: true
          })
        } else {
          this.$noty.error(res.msg, {
            killer: true
          })
        }
      })
    },
    imgError(type) {
      if (type === 'avatar') {
        this.profile.avatar = BlogConfig.defaultAvatar
        this.avatarImg = this.profile.avatar
      }
      if (type === 'banner') {
        this.profile.bannerImg = BlogConfig.defaultBanner
        this.bannerImg = this.profile.bannerImg
      }
    },
    //查询该作者的文章
    async setupPost() {
      let res = await this.$post(`article/post/`, this.queryParam)
      if (res.code == 200) {
        this.post = res.data.list
        this.page_count = res.data.pages
      } else {
        this.$noty.error(res.msg, {
          killer: true
        })
      }
    },
    setConfirmStatus(status, id) {
      this.isDeletePostActive = status
      this.postCursor = id
    },
    openProfileEditor() {
      if (!this.isMe) return
      this.$refs.headerEditor.scrollTop = 0
      this.isProfileEditorActive = this.isProfileEditorActive === 'disable' ? 'active' : 'disable'
      if (this.isProfileEditorActive === 'disable') {
        //更新到数据库
        this.updateNickname()
      }
    },
    beforeUpload(type) {
      if (type === 'banner_img') {
        this.$refs.bannerIMG.click()
      }
      if (type === 'avatar_img') {
        this.$refs.avatarIMG.click()
      }
    },
    upload(event, type) {
      profileUpload.upload(this, event, type)
      if (type === 'avatar_img') {
        this.profile.avatar = this.$store.state.profile.avatar
        this.avatarImg = this.$store.state.profile.avatar
        console.log('更新了头像', this.profile.avatar)
      } else {
        this.profile.bannerImg = this.$store.state.profile.bannerImg
        this.bannerImg = this.$store.state.profile.bannerImg
        console.log('更新了背景图', this.profile.bannerImg)
      }

    },
    updateNickname() {
      this.isProfileEditorActive = 'disable'
      const res = this.$post('user/updateInfo', {
        nickname: this.$refs.nickname.value,
        bannerImg: this.bannerImg,
        avatar: this.avatarImg,
        account: this.$store.state.profile.account,
      }, {
        headers: {
          Authorization: this.$store.state.token
        }
      })
      this.$message.success('更新完毕！')
      location.reload()
    },
    async changeEmail() {
      if (this.profile.email_verified === 0) {
        const res = await this.$post('user/verification', {
          type: 'email',
          id: this.profile.id,
          email: this.email
        })
        this.$noty.success(res.msg, {
          killer: true
        })
      }
      if (this.profile.email_verified === 1) {
        const res = await this.$post('user/verification', {
          type: 'email',
          id: this.profile.id
        })
        this.$noty.success(res.msg, {
          killer: true
        })
      }
    },
    async changePassword() {
      const res = await this.$post('user/verification', {
        type: 'password',
        id: this.profile.id
      })
      this.$noty.success(res.msg, {
        killer: true
      })
    },
    async loadProfile() {
      //1、查询个人主页信息
      await this.setupProfile()
      //2、查询此人文章列表
      await this.setupPost()
      //  3、检查此主页是否是也登陆用户主页
      let user = this.$store.state.profile
      console.log('loadProfile - user', user)
      console.log('loadProfile - profile', this.profile)
      if (user.account === this.profile.account) {
        //是本人主页
        this.isMe = true
      }
    }
  },
  watch: {
    $route: {
      handler() {
        this.loadProfile()
      },
      deep: true
    }
  },
  components: {
    PageButton,
    BlackMask,
    ConfirmDialog,
    BaseLayout
  },
  created() {
    this.loadProfile()
  }
}
</script>

<style scoped lang="sass">
@import "src/assets/style/views/Profile"
</style>
