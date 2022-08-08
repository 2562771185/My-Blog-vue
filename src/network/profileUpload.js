export const upload = (source, evnet, type) => {
  const file = event.target.files[0]
  const formData = new FormData()
  // formData.append('type', type)
  formData.append('file', file)
  if (formData.get(type) !== undefined && file !== undefined) {
    source.$post('oss/upload', formData, {
      headers: {  }
    }).then(res => {
      if (res.code === 200) {
        if (type === 'banner_img') {
          // const link = res.link + '?ramdom=' + Math.random() * 10
           source.bannerImg = res.data
          source.$store.commit('updateProfileImg', {
            type,
            link:res.data
          })
        }
        if (type === 'avatar_img') {
          // const link = source.avatarImg = res.link + '?ramdom=' + Math.random() * 10
          source.avatarImg = res.data
          source.$store.commit('updateProfileImg', {
            type,
            link:res.data
          })
        }
      }
    })
  }
}
