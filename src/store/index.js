import Vue from 'vue'
import Vuex from 'vuex'
import { BlogConfig } from '@/config/blog.config'
import cookie from 'vue-cookie'
import profile from '../views/Profile'
import axios from 'axios'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    loaded: false,
    blogName: BlogConfig.blogName,
    apiURL: BlogConfig.apiURL,
    isLogin: false,
    token: '',
    profile: {
      id:'',
      account: '',
      nickname: '',
      avatar: ''
    },
    isLoading: false
  },
  mutations: {
    updateLoginState(state) {
      const token = localStorage.getItem(BlogConfig.tokenName)
      // console.log('验证token前: ',state.isLogin)
      axios.get(BlogConfig.apiURL+`user/checkToken`,{
        headers: { Authorization: token }
      }).then(res =>{
        console.log('checkToken:',res)
        if (res.data.code === 200){
          state.isLogin = true
          state.profile.account = res.data.data.account
          state.profile.id = res.data.data.id
          state.profile.avatar = res.data.data.avatar
          state.profile.nickname = res.data.data.nickname
        }else{
          localStorage.removeItem(BlogConfig.tokenName)
        }
        // console.log('验证token后: ',state.isLogin)
      })
    },
    logout() {
      const token = localStorage.getItem(BlogConfig.tokenName)
      localStorage.removeItem(BlogConfig.tokenName)
      //删除后端的token
      axios.get(BlogConfig.apiURL+`user/delToken?token=${token}`).then(res =>{
        console.log('delToken:',res)
      })
    },
    setToken(state, token) {
      state.token = token
    },
    setLoadStatus(state, status) {
      state.loaded = status
    },
    defaultProfile(state) {
      state.profile.account = '未登录'
      state.profile.avatar = BlogConfig.defaultAvatar
      state.profile.banner_img = BlogConfig.defaultBanner
    },
    setLoadingStatus(state, isLoading) {
      state.isLoading = isLoading
    },
    updateProfileImg(state, options) {
      if (options.type === 'banner_img') state.profile.banner_img = options.link
      if (options.type === 'avatar_img') state.profile.avatar = options.link
    },
    updateProfile(state, profile) {
      state.profile = profile
    },
    getProfile(state){
      return state.profile
    }
  },
  getters: {},
  actions: {
    async updateProfile(context) {
      const res = await Vue.prototype.$get(context.state.apiURL + 'user/checkToken', {
        headers: { Authorization: context.state.token }
      })
      if (res !== undefined) {
        if (res.code === 200) {
          this.commit('updateProfile', res.data)
        } else {
          localStorage.removeItem(BlogConfig.tokenName)
          this.commit('updateLoginState')
          // this.commit('defaultProfile')
        }
      }
    }
  },
  modules: {},
})
