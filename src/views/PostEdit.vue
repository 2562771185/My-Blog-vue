<template>
  <base-layout>
    <div id="postedit-container">
      <div id="postedit-body">
        <el-dialog
          title="上传文件"
          :close-on-click-modal="false"
          @close="closeHandle"
          :visible.sync="visible">
          <el-upload
            drag
            action="http://localhost:3003/oss/uploadlist"
            :before-upload="beforeUploadHandle"
            :on-success="successHandle"
            multiple
            :file-list="fileList"
            style="text-align: center;">
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
            <div class="el-upload__tip" slot="tip">只支持jpg、png、gif格式的图片！</div>
          </el-upload>
        </el-dialog>
        <div id="header-img">

          <!--          <div @click="$refs.bannerIMG.click()" :class="bannerIMG !== '' ? 'active' : ''" id="header-img-upload">-->
          <!--            <font-awesome-icon :icon="['fas', 'arrow-circle-up']"/>-->
          <!--            <span>选择图片进行上传...<br/>(不上传以用户主页头图作为封面)</span>-->
          <!--          </div>-->
          <input @change="updateBanner" v-show="false" ref="bannerIMG" class="file" name="file" type="file"
                 accept="image/png,image/gif,image/jpeg"/>
          <img :src="bannerIMG" onload="this.style.opacity = 1"/>
        </div>
        <el-button type="primary" @click="openBanner">{{ bannerIMG == '' ? '上传封面图' : '更新封面图' }}</el-button>

        <div id="postedit-header">
          <span id="hashtag">#标题:</span>
          <input v-model="post.title" id="postedit-title" maxlength="255" type="text" value="Title"><br>
          <el-button type="text">简介：</el-button>
          <el-input
            type="textarea"
            :rows="2"
            placeholder="请输入文章简介"
            v-model="post.summary">
          </el-input>
          <!--          <span id="hashtag">#简介</span>-->
          <!--          <input v-model="post.summary" id="postedit-summary" maxlength="100" type="text" value="Title">-->
          <div id="postedit-avatar">
            <router-link :to="'/profile/' + post.user.username">
              <img @error="imgError('avatar')" :src="post.user.avatar_img"/>
            </router-link>
          </div>
          <div id="nickname">{{ post.user.nickname }}</div>
        </div>
        <div id="postedit-editor">
          <div id="postedit-tips">
            <span>*上传的文件大小不得超过4MB</span>
            <span><a href="https://ld246.com/guide/markdown">使用说明</a></span>
          </div>
          <div id="vditor"></div>
        </div>
        <div id="postedit-toolbar">
          <!--          //验证码-->
          <!--        <span>-->
          <!--          <img :src="codeUrl" alt="" class="captcha-img">-->
          <!--          <input @keypress.enter="submit" v-model="captchaKey" type="text">-->
          <!--        </span>-->
          <span>
          <router-link v-if="id.toLowerCase() !== 'new'" :to="'/post/' + $route.params.id" tag="button" id="view-btn">查看文章</router-link>
          <button @click="submit" id="submit-btn">{{ id.toLowerCase() === 'new' ? '发布' : '更新' }}</button>
        </span>
        </div>
      </div>
    </div>
  </base-layout>
</template>

<script>
import Vditor from 'vditor'
import 'vditor/src/assets/scss/index.scss'
import { mobileToobBar, uploadConfig } from '@/config/vditor.config'
import captchaKey from '@/components/captchaKey'
import { BlogConfig } from '@/config/blog.config'
import BaseLayout from '@/components/BaseLayout'

export default {
  name: 'PostEdit',
  data() {
    return {
      BlogConfig,
      contentEditor: '',
      screenWidth: document.body.clientWidth,
      captchaKey: '',
      uuid: '',
      bannerIMG: '',
      codeUrl: '',
      id: 'new',
      bodyId: null,
      post: {
        banner: '',
        cover: '',
        title: '',
        content: '',
        user: {
          avatar_img: null,
          nickname: null,
          account: null
        }
      },
      visible: false,
      url: 'http://localhost:3003/oss/upload',
      num: 0,
      successNum: 0,
      fileList: []
    }
  },
  created() {
    this.init()
  },
  mounted() {
    this.setupEditor()
  },
  methods: {
    openBanner() {
      this.visible = true
    },
    getCode() {
      //删除刷新之前的验证码
      if (this.uuid != '') {
        this.$post(`/delCaptcha?uuid=${this.uuid}`)
      }
      this.$get('/captchaImage').then(res => {
        this.codeUrl = 'data:image/gif;base64,' + res.img
        this.uuid = res.uuid
      })
    },
    init() {
      this.url = ''
      //
      if (!this.$store.state.isLogin) this.$router.push('/login')
      if (typeof this.$route.params.id !== 'undefined') {
        this.id = this.$route.params.id
      }
      if (this.id.toLowerCase() === 'new') {
        document.title = `发表文章 - ${this.BlogConfig.blogName}`
        this.post.user.avatar_img = this.$store.state.profile.avatar
        this.post.user.nickname = this.$store.state.profile.nickname
        this.post.user.account = this.$store.state.profile.account
      }
    },
    async setupContent() {
      const res = await this.$get(`article/edit?id=${this.id.toLowerCase()}`, {
        headers: {
          Authorization: this.$store.state.token
        }
      })
      if (res.code === 200) {
        this.post.title = res.data.title
        this.post.summary = res.data.summary
        this.post.user.avatar_img = res.data.authorAvatar
        this.post.user.nickname = res.data.nickname
        this.post.user.account = res.data.account
        this.post.id = res.data.articleBody.articleId
        this.bodyId = res.data.articleBody.id
        this.contentEditor.setValue(res.data.articleBody.content)
        if (res.data.articleCover !== undefined && res.data.articleCover !== '' && res.data.articleCover !== null) {
          this.bannerIMG = res.data.articleCover
        }
        console.log('post', this.post)
        //
        if (this.$store.state.profile.account !== this.post.user.account) {
          console.log(this.$store.state.profile.account)
          console.log(this.post.user.account)
          console.log('不是你能编辑的文章！ ')
          await this.$router.push('/')
        }
        //
        document.title = `${res.data.title} - ${this.BlogConfig.blogName}`
      } else {
        await this.$router.push('/postedit/new')
        this.$noty.error(res.msg, {
          killer: true
        })
      }
    },
    imgError(type) {
      if (type === 'avatar') {
        this.post.user.avatar_img = BlogConfig.defaultAvatar
      }
      if (type === 'banner') {
        this.post.cover = BlogConfig.defaultBanner
      }
    },
    setupEditor() {
      const that = this
      window.onresize = () => {
        return (() => {
          window.screenWidth = document.body.clientWidth
          that.screenWidth = window.screenWidth
        })()
      }
      let toolbar
      if (this.screenWidth < 480) toolbar = mobileToobBar
      this.contentEditor = new Vditor('vditor', {
        minHeight: 550,
        height: window.innerHeight / 2,
        toolbarConfig: {
          pin: true
        },
        cache: {
          enable: false
        },
        upload: {
          accept: 'image/jpg, image/jpeg, image/png,image/gif',//规定上传的图片格式
          url: BlogConfig.apiURL + 'oss/uploadlist',//请求的接口
          multiple: false,
          fieldName: 'file',
          max: 4 * 1024 * 1024,//上传图片的大小
          //extraData: {'access_token': this.token}, //为 FormData 添加额外的参数
          linkToImgUrl: BlogConfig.apiURL + 'oss/uploadlist',
          filename(name) {
            return name.replace(/[^(a-zA-Z0-9\u4e00-\u9fa5\.)]/g, '')
              .replace(/[\?\\/:|<>\*\[\]\(\)\$%\{\}@~]/g, '')
              .replace('/\\s/g', '')
          },
          format(files, responseText) {
            console.log('responseText', responseText)
            let data = JSON.parse(responseText)
            console.log('data', data)
            let url = data.data
            let msg = data.msg
            let code = data.code
            let filName = url
            //上传图片请求状态
            if (data.code == 200) {
              that.$message({
                message: '图片上传成功！',
                type: 'success'
              })
              let imgName = url.substr(url.lastIndexOf('-') + 1)
              console.log('imgName:', imgName)
              let succ = {}
              succ[imgName] = url
              //图片回显
              return JSON.stringify({
                msg,
                code,
                data: {
                  errFiles: [],
                  succMap: succ
                  // succMap: {
                  //   "default.png" : `${url}`
                  // }
                }
              })
            } else {
              that.$message({
                message: '图片上传失败！',
                type: 'error'
              })
            }
          }
        },
        toolbar,
        after: () => {
          if (this.id.toLowerCase() !== 'new') {
            this.setupContent()
          }
        }
      })
    },
    //更新文章操作
    async submit() {
      this.post.content = this.contentEditor.getValue()
      const formData = new FormData()
      if (this.id == 'new') {
        //新增
        console.log('新增文章')
        formData.append('title', this.post.title)
        formData.append('account', this.post.user.account)
        formData.append('content', this.post.content)
        formData.append('cover', this.post.cover)
        formData.append('summary', this.post.summary)
        const res = await this.$post('article/publish', formData)
        if (res.code === 200) {
          await this.$router.push('/post/' + res.data)
          this.$noty.success(res.msg, {
            killer: true
          })
        } else {
          this.$noty.error(res.msg, {
            killer: true
          })
        }
      } else {
        //更新
        console.log('更新文章')
        formData.append('title', this.post.title)
        formData.append('id', this.post.id)
        formData.append('content', this.post.content)
        formData.append('bodyId', this.bodyId)
        formData.append('cover', this.post.cover)
        formData.append('summary', this.post.summary)
        const res = await this.$post('article/update', formData)
        if (res.code === 200) {
          await this.$router.push('/post/' + res.data)
          this.$noty.success(res.msg, {
            killer: true
          })
        } else {
          this.$noty.error(res.msg, {
            killer: true
          })
        }
      }
    }
    ,
    updateBanner() {
      const bannerImgInput = this.$refs.bannerIMG
      const file = bannerImgInput.files[0]
      this.bannerIMG = URL.createObjectURL(file)
    }
    ,
    // 上传之前
    beforeUploadHandle(file) {
      if (file.type !== 'image/jpg' && file.type !== 'image/jpeg' && file.type !== 'image/png' && file.type !== 'image/gif') {
        this.$message.error('只支持jpg、png、gif格式的图片！')
        return false
      }
      this.num++
    }
    ,
    // 上传成功
    successHandle(response, file, fileList) {
      this.fileList = fileList
      this.successNum++
      if (response && response.code === 200) {
        this.bannerIMG = response.data
        this.post.cover = response.data
        if (this.num === this.successNum) {
          this.$confirm('操作成功, 是否继续操作?', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }).catch(() => {
            this.visible = false
          })
        }
      } else {
        this.$message.error(response.msg)
      }
    }
    ,
    // 弹窗关闭时
    closeHandle() {
      this.fileList = []
      this.$emit('refreshDataList')
    }
  },
  watch: {
    screenWidth(val) {
      console.log(this.contentEditor.toolbar)
      if (val < 350) {
      }
    }
  },
  components: {
    captchaKey,
    BaseLayout
  }
}
</script>

<style scoped lang="sass">
@import "src/assets/style/views/PostEdit"
</style>
