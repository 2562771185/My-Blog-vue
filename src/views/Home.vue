<template>
  <base-layout>
    <div id="home-container">
      <div id="content">
        <div id="posts">
          <div id="void-content" v-show="this.post.length <= 0">
            <span id="void-title">空空如也~~</span>
          </div>
          <div v-for="(value, index) in post" :key="index" class="post-container">
            <div class="post-image">
              <img v-viewer onload="this.style.opacity = 1" @error="postImgError('banner',index)"
                   :id="'banner_' + index" alt="banner" :src="value.cover"/>
            </div>
            <div class="post">
              <div class="post-content">
                <div class="post-avatar">
                  <router-link :to="'/profile?account=' + value.authorAccount">
                    <img onload="this.style.opacity = 1" :title="value.authorNickname"
                         @error="postImgError('avatar',index)" :id="'avatar_' + index" alt="avatar"
                         :src="value.authorCover"/>
                  </router-link>
                </div>
                <div class="post-title">
                  <router-link :to="'/post/' + value.id">{{ value.title }}</router-link>
                </div>
                <hr>
                <div class="post-context">
                  <div class="post-text" v-html="value.summary"></div>
                </div>
                <div class="post-footer">
                  <div class="post-detail">
            <span class="post-time">
              <font-awesome-icon class="menu-icon login" :icon="['fas', 'clock']"/>
              {{ value.gmtCreate }}
            </span>
                    <span class="post-author">
                    <router-link tag="a" :to="'/profile?account=' + value.authorAccount">
                      <font-awesome-icon class="menu-icon login" :icon="['fas', 'user-circle']"/>
                      {{ value.authorNickname }}
                    </router-link>
            </span>
                  </div>
                  <div class="footer-more">
                    <router-link tag="a" :to="'/post/' + value.id" class="post-more">阅读全文
                      <font-awesome-icon class="menu-icon login" :icon="['fas', 'angle-right']"/>
                    </router-link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <page-button v-show="!postIsNull && $store.state.loaded" :maxpage="page_count"></page-button>
        </div>
      </div>
      <div id="user" v-show="$store.state.loaded">
        <div class="user-panel" id="user-main">
          <div id="user-image">
            <img v-viewer id="user-banner" onload="this.style.opacity = 1"
                 :src="profile.avatar == ''?BlogConfig.defaultBanner:profile.avatar"/>
          </div>
          <div id="user-avatar">
            <router-link :to="$store.state.isLogin ?'/profile?account=' + profile.account : '/login'"><img onload="this.style.opacity = 1"
                                                                   @error="imgError('avatar')"
                                                                   :src="profile.avatar"/></router-link>
          </div>
          <div id="user-nickname">{{ profile.nickname }}</div>
          <div id="user-username">{{ $store.state.isLogin ? '@' + profile.account : '未登录' }}</div>
          <router-link :to="$store.state.isLogin ? '/profile?account=' + profile.account : '/login'">
            <button id="user-profile-btn">{{ $store.state.isLogin ? '个人中心' : '登录' }}</button>
          </router-link>
          <div id="user-post">
            <span class="user-post-tips-top"><span v-if="!userPostIsNull">来写篇文章吧 <font-awesome-icon class="icon-arrow"
                                                                                                    :icon="['fas', 'angle-right']"/></span></span>
            <input type="checkbox" id="show-post" checked/>
            <label for="show-post">
              <span class="user-post-option"><span v-if="userPostIsNull">最近文章 <font-awesome-icon class="icon-arrow"
                                                                                                 :icon="['fas', 'angle-up']"/></span></span>
              <span class="user-post-option"><router-link tag="a" to="/postedit/new" class="post-list-new">发表文章 <font-awesome-icon
                class="icon-plus" :icon="['fas', 'plus']"/></router-link></span>
            </label>
            <div id="post-list">
              <span id="post-list-title" v-if="userPostIsNull">最近文章</span>
              <span class="user-post-tips"><span v-if="!userPostIsNull">来写篇文章吧 <font-awesome-icon class="icon-arrow"
                                                                                                  :icon="['fas', 'angle-right']"/></span></span>
              <router-link tag="a" :to="$store.state.isLogin ? '/postedit/new' : '/login'" class="post-list-new">发表文章
                <font-awesome-icon class="icon-plus" :icon="['fas', 'plus']"/>
              </router-link>
              <ul>
                <li v-for="(item, index) in userPost" :key="index">
                  <router-link :to="'/post/' + item.id" tag="a">
                    <font-awesome-icon class="icon-arrow" :icon="['fas', 'angle-right']"/>
                    {{ item.title }}
                  </router-link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </base-layout>

</template>

<script>
import BaseLayout from '@/components/BaseLayout'
import PageButton from '@/components/PageButton'
import { BlogConfig } from '@/config/blog.config'

export default {
  name: 'Home',
  data() {
    return {
      postIsNull: null,
      page_count: null,
      profile: {},
      post: null,
      userPost: [],
      BlogConfig: null,
      author: {},
      queryParam: {
        page: 1,
        account: null,
        search:''
      },
    }
  },
  components: {
    PageButton,
    BaseLayout
  },
  computed: {
    userPostIsNull() {
      return (this.userPost.length > 0)
    }
  },
  methods: {
    imgError(type) {
      if (type === 'avatar') this.profile.avatar_img = BlogConfig.defaultAvatar
      if (type === 'banner') this.profile.banner_img = BlogConfig.defaultBanner
    },
    postImgError(type, index) {
      if (type === 'avatar') document.querySelector(`#${type}_${index}`).src = BlogConfig.defaultAvatar
      if (type === 'banner') document.querySelector(`#${type}_${index}`).src = BlogConfig.defaultBanner
    },
    async setupPost() {
      console.log('setupPost')
      this.post = []
      const query = this.$route.query
      this.queryParam.search = query.search === undefined ? '' : `${query.search}`
      this.queryParam.page = query.p === undefined ? 1 : query.p
      await this.$post(`article/post/`, this.queryParam).then(res =>{
        console.log('查询文章', res)
        if (res.code != 200) {
          this.page_count = 1
          this.postIsNull = true
        } else {
          this.post = res.data.list
          this.page_count = res.data.pages
        }
      })

    }
  },
  mounted() {
    document.title = `${this.BlogConfig.blogName}`
    this.profile = this.$store.state.profile
  },
  created() {
    console.log('created')
    this.BlogConfig = BlogConfig
    this.setupPost()
  },
  watch: {
    '$store.state.profile': {
      deep: true,
      handler: function (newValue, oldValue) {
        if (newValue !== null) {
          this.profile = newValue
        }
      }
    },
    //监听url路径变化
    $route(to, from) {
      this.setupPost()
    }
  }
}
</script>
<style scoped lang="sass">
@import "src/assets/style/views/Home"
</style>
