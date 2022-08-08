<template>
  <base-layout>
    <div id="post-container">
      <div id="post-body" :class="$store.state.loaded ? '' : 'hide'">
        <div id="header-img" v-viewer>
          <img onload="this.style.opacity = 1" @error="imgError('banner')" :src="post.cover"/>
        </div>
        <div id="post-header">
          <div id="post-title">{{ post.title }}</div>
          <div id="post-avatar">
            <router-link :to="'/profile?account=' + post.authorAccount">
              <img onload="this.style.opacity = 1" @error="imgError('avatar')" :src="post.authorCover"/>
            </router-link>
          </div>
          <div id="nickname">{{ post.authorNickname }}</div>
          <div id="post-toolbar" :style="post.authorId === $store.state.profile.id ? '' : 'height: 30px;'">
            <div id="post-date">
              <span>由 <span>{{ post.authorNickname }}</span> 更新于 <span>{{ post.gmtModified }}</span></span>
            </div>
            <div v-if="post.authorId === $store.state.profile.id" id="post-option">
              <router-link tag="span" :to="'/postedit/' + post.id" id="post-edit">
                <font-awesome-icon class="menu-icon login" :icon="['fas', 'pen']"/>
              </router-link>
              <span @click="isDeletePostActive = 'active'" tag="span" id="post-delete"><font-awesome-icon
                class="menu-icon login" :icon="['fas', 'trash']"/></span>
            </div>
          </div>
        </div>
        <div id="post-context" v-viewer></div>

        <div id="post-comment">
          <span id="submit-comment-title" v-if="$store.state.isLogin">发表评论</span>
          <textarea v-if="$store.state.isLogin" @keypress.ctrl.enter="postComment" v-model="commentValue" name="" id=""
                    cols="30" rows="10" maxlength="255"></textarea>
          <button v-if="$store.state.isLogin" @click="postComment" id="submit-comment">提交留言</button>
          <div id="submit-comment-not-login" v-else>
            <span>您还未登录,请先<router-link to="/login">登录</router-link>再发表评论</span>
          </div>
        </div>
        <div id="post-comment-context">
          <span v-show="!postIsNull" id="post-comment-title">评论</span>
          <div v-for="(value, index) in commentList" :key="index" class="post-comment">
            <div class="post-comment-header">
            <span class="avatar">
<!--              <router-link :to="'/profile/' + value.authorId">-->
              <img onload="this.style.opacity = 1" @error="avatarImgError(index)" :src="value.authorAvatar"
                   :id="'comment_avatar_' + index"/>
              <span class="comment-nickname">{{ value.authorNickname }}</span>
<!--                </router-link>-->
            </span>
              <span class="post-time">
              <font-awesome-icon class="menu-icon login" :icon="['fas', 'clock']"/>
              {{   new Date(value.createDate) | formatTimer}}
            </span>
            </div>
            <div class="post-comment-context">{{ value.content }}</div>
            <div class="post-comment-options">
              <span @click="delComment(value.id)" v-if="value.authorId == $store.state.profile.id">删除评论</span>
            </div>
          </div>
          <page-button v-show="!postIsNull" :maxpage="page_count"></page-button>
        </div>
      </div>
      <confirm-dialog :id="post.id" :setpost="setupPost" @status="setConfirmStatus" :class="isDeletePostActive">
        <template v-slot:title>删除文章</template>
        <template v-slot:content>即将永久移除该文章,确定删除吗?</template>
      </confirm-dialog>
      <black-mask @click.native="setConfirmStatus('disable')" :class="isDeletePostActive"></black-mask>
    </div>
  </base-layout>
</template>

<script>
import { BlogConfig } from '@/config/blog.config'
import ConfirmDialog from '@/components/DelPost'
import BlackMask from '@/components/BlackMask'
import PageButton from '@/components/PageButton'
import BaseLayout from '@/components/BaseLayout'
import Vditor from 'vditor'
import 'vditor/src/assets/scss/index.scss'

export default {
  name: 'Post',
  data() {
    return {
      BlogConfig,
      isDeletePostActive: 'disable',
      commentValue: null,
      post: {},
      commentList: null,
      page_count: null
    }
  },
  computed: {
    postIsNull: function () {
      return (this.commentList === null)
    }
  },
  methods: {
    imgError(type) {
      if (type === 'avatar') {
        this.post.authorCover = BlogConfig.defaultAvatar
      }
      if (type === 'banner') {
        this.post.cover = BlogConfig.defaultBanner
      }
    },
    avatarImgError(index) {
      document.querySelector(`#comment_avatar_${index}`).src = BlogConfig.defaultAvatar
    },
    async setupPost() {
      const res = await this.$get(`article/get?id=${this.$route.params.id}`)
      console.log('article', res)
      if (res.code !== 200) {
        await this.$router.push('/')
        this.$noty.error(res.msg, {
          killer: true
        })
        return
      }
      this.post = res.data
      //查出主体内容
      const articleBody = await this.$get(`body/get?id=${this.post.bodyId}`)
      console.log('articleBody', articleBody)
      if (articleBody.code === 200) {
        await Vditor.preview(document.querySelector('#post-context'), articleBody.data.content)
      }
      document.title = `${res.data.title} - ${this.BlogConfig.blogName}`
    },
    //查询评论列表
    async setupComment() {
      this.commentList = null
      this.commentValue = ''
      const query = this.$route.query
      const params = this.$route.params
      const page = query.p === undefined ? 'page=1' : 'page=' + query.p
      const res = await this.$get(`comment/get?id=${params.id}&${page}`)
      console.log('commentPage', res)
      this.commentList = res.data.list
      this.page_count = res.data.pages

    },
    setConfirmStatus(status) {
      this.isDeletePostActive = status
    },
    async postComment() {
      if (this.commentValue == ''){
        this.$noty.warning('请输入评论内容', {
          killer: true
        })
      }else{
        const res = await this.$post('comment/add', {
          articleId: this.post.id,
          authorId: this.$store.state.profile.id,
          content: this.commentValue
        })
        if (res.code === 200) {
          this.$noty.success(res.msg, {
            killer: true
          })
          await this.setupComment()
        } else {
          this.$noty.error(res.msg, {
            killer: true
          })
        }
        await this.setupComment()
      }
    },
    async delComment(commentId) {
      const postId = Number(this.$route.params.id)
      const res = await this.$post('comment/delete', {
        articleId: postId,
        commentId: commentId
      })
      if (res.code === 200) {
        this.$noty.success(res.msg, {
          killer: true
        })
        await this.setupComment()
      } else {
        this.$noty.error(res.msg, {
          killer: true
        })
      }
    }
  },
  created() {
    this.setupPost()
    this.setupComment()
    console.log('loginuser',this.$store.state.profile)
  },
  watch: {
    $route: {
      handler() {
        this.setupComment().then(() => {
          document.documentElement.scrollTop = document.querySelector('#post-comment-context').offsetTop - 150
        })
      },
      deep: true
    }
  },
  components: {
    ConfirmDialog,
    BlackMask,
    PageButton,
    BaseLayout
  },
  filters: {
    formatTimer: function(value) {
      let date = new Date(value);
      let y = date.getFullYear();
      let MM = date.getMonth() + 1;
      MM = MM < 10 ? "0" + MM : MM;
      let d = date.getDate();
      d = d < 10 ? "0" + d : d;
      let h = date.getHours();
      h = h < 10 ? "0" + h : h;
      let m = date.getMinutes();
      m = m < 10 ? "0" + m : m;
      let s = date.getSeconds();
      s = s < 10 ? "0" + s : s;
      return y + "-" + MM + "-" + d + " " + h + ":" + m + ":" + s;
    }
  },
}
</script>

<style lang="sass">
@import "src/assets/style/views/Post"
</style>
