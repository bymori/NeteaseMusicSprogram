/*
 * @Descripttion: 
 * @version: 
 * @Author: by_mori
 * @Date: 2021-05-19 18:13:05
 * @LastEditors: by_mori
 * @LastEditTime: 2021-05-23 21:31:33
 */
// pages/video/video.js
import request from '../../utils/request';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    videoGroupList:[], //导航标签数据
    navId:'',//导航标识
    videoList:[],//视频列表数据
    videoId:'',//视频id标识
    videoUpdateTime:[],//记录video播放的时长
    isTriggered:false,//标识下拉刷新是否被触发
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //获取导航数据
    this.getVideoGroupListData()
    
  },

  //获取导航数据
  async getVideoGroupListData(){
    let videoGroupListData=await request('/video/group/list')
    this.setData({
      videoGroupList:videoGroupListData.data.slice(0,14),
      navId:videoGroupListData.data[0].id
    })

    //获取视频列表数据
    this.getVideoList(this.data.navId)
    
  },

  //获取视频列表数据
  async getVideoList(navId){
    if (!navId) {
      return
    }
    //let videoListData=await request('/video/group',{id:navId})
    let videoListData = await request('/video/group', {id: navId});
    //获取视频后关闭消息加载/提示框
    wx.hideLoading()

    

    let index=0
     let videoList=videoListData.datas.map(item=>{
      item.id=index++
      return item;
    }) 
    this.setData({
      videoList,
      isTriggered:false, //关闭下拉刷新
    })
  },

  /* // 获取视频列表数据
  async getVideoList(navId){
    if(!navId){ // 判断navId为空串的情况
      return;
    }
    let videoListData = await request('/video/group', {id: navId});
    let index = 0;
    let videoList = videoListData.datas.map(item => {
      item.id = index++;
      return item;
    })
    this.setData({
      videoList,
    })
  }, */

  //点击切换导航的回调
  changeNav(event){
    //let navId=event.currentTarget.id //通过id向event传参的时候 如果传的是nuber会自动转换成string  navId:navId*1  或者使用位移运算符 navId:navId>>>0 右移零位会将 number 数据强转换成 number
    let navId=event.currentTarget.dataset.id //通过data- 传入 不会自动转换类型
    this.setData({
      navId,
      videoList:[]
    })

    //显示正在加载
    wx.showLoading({
      title:'正在加载'
    })
    //动态获取当前导航对应的视频数据
    this.getVideoList(this.data.navId);
  },
  

  //点击播放/继续播放的回调
  handlePlay(event){
    //console.log("play");
    /* 
    问题 多个视频同时播放
    需求：
      1.在点击播放的事件中需要找到上一个播放的视频
      2.在播放新的视频之前 关闭/暂停上一个正在播放的视频
    关键：
      1.***找到上一个视频的实例对象
      2.如何判断点击播放的视频和正在播放的视频不是同一个视频
    设计模式-单例模式：
      1.需用创建多个对象的场景下 通过一个变量接受 始终保持一个对象
      2.节省内存空间
    */
    let vid=event.currentTarget.id
    //关闭上一个播放的视频
    this.vid!==vid&& this.videoContext && this.videoContext.stop()
    //if (this.vid!==vid) {
    //  if (this.videoContext) {
    //    this.videoContext.stop()
    //  }
    //}
    this.vid=vid

    //更新data中videoId的状态数据
    this.setData({
      videoId:vid
    })
    
    //创建控制video标签的实例对象
    this.videoContext=wx.createVideoContext(vid)
    //判断当的须之前是否播放过，是否有播放记录，如果有，转至指定的播放位置
    let {videoUpdateTime}=this.data
    let videoItem=videoUpdateTime.find(item=>item.vid===vid)
    if (videoItem) {
      this.videoContext.seek(videoItem.currentTime)
    }

    //this.videoContext.play() //点击图片自动播放 或使用 视频组件autoplay属性
    //this.videoContext.stop()

    
  },

  //监听视频播放进度的回调
  handleTimeUpdate(event){
      //console.log(event);
      let videoTimeObj={vid:event.currentTarget.id,currentTime:event.detail.currentTime}
      let {videoUpdateTime}=this.data
      /* 
        思路 判定记录播放时长的 videoUpdateTime 数组中 是否有当前视频的播放记录
        1.如果有 在原有的播放记录中修改播放时间为当前对象的播放时间
        2.如果没有 需要在数组中添加当前视频的播放对象
      */
      let videoItem=videoUpdateTime.find(item=>item.vid===videoTimeObj.vid)
      videoItem ? videoItem.currentTime=event.detail.currentTime : videoUpdateTime.push(videoTimeObj);
      //更新videoUpdateTime的状态
      this.setData({
        videoUpdateTime
      })
  },

  //视频播放结束调用
  handleEnded(envent){
    //console.log("end");
    //移除播放时长数组中 当前视频的对象
    let {videoUpdateTime}=this.data
    videoUpdateTime.splice(videoUpdateTime.findIndex(item=>item.vid===envent.currentTarget.id),1)
    this.setData({
      videoUpdateTime
    })
  },

  //自定义下拉刷新的的回调 scroll-view
  handleRefresher(){
    console.log("下拉刷新");
    //再次发送请求 获取最新的视频列表视频
    this.getVideoList(this.data.navId)
  },
  //自定义上拉触底的回调 scroll-view
  handleTolower(){
    console.log("上拉触底加载新视频");
    //
    /* 数据分页：
      1. 后端分页
          后端只给一定数量 请求一次接受一次
      2. 前端分页
          后端发回多条数据 前端展示部分 刷新加载更多
     */
    //console.log('发送请求 || 在前端截取最新的数据 追加到视频列表的后方');
    //console.log('网易云暂时没有分页的api');

    //模拟数据
    let newVideoList=[
        {
            "type": 1,
            "displayed": false,
            "alg": "onlineHotGroup",
            "extAlg": null,
            "data": {
                "alg": "onlineHotGroup",
                "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
                "threadId": "R_VI_62_4EF7A0400B7E12BD360FC709D93D23BC",
                "coverUrl": "https://p2.music.126.net/6b-p2wJJOdIPJi0Qo2g68w==/109951163574357612.jpg",
                "height": 360,
                "width": 640,
                "title": "法国小哥演绎别样Eminem《Lose yourself》开嗓震惊全场！",
                "description": "法国小哥演绎别样Eminem《Lose yourself》开嗓震惊全场！[惊恐]\n\n#在云村看现场#",
                "commentCount": 1568,
                "shareCount": 5590,
                "resolutions": [
                    {
                        "resolution": 720,
                        "size": 35340210
                    },
                    {
                        "resolution": 480,
                        "size": 27755076
                    },
                    {
                        "resolution": 240,
                        "size": 17192203
                    }
                ],
                "creator": {
                    "defaultAvatar": false,
                    "province": 1000000,
                    "authStatus": 0,
                    "followed": false,
                    "avatarUrl": "http://p1.music.126.net/Fn4S3zBPuUtqbY33FXrc0g==/109951165661336154.jpg",
                    "accountStatus": 0,
                    "gender": 1,
                    "city": 1010000,
                    "birthday": 883929600000,
                    "userId": 347267113,
                    "userType": 204,
                    "nickname": "Dennnnnniel",
                    "signature": "看我男朋友的个人简介干嘛？:(",
                    "description": "",
                    "detailDescription": "",
                    "avatarImgId": 109951165661336160,
                    "backgroundImgId": 109951165698066580,
                    "backgroundUrl": "http://p1.music.126.net/QdqRMHtwWSEHvl4VkwRI0Q==/109951165698066572.jpg",
                    "authority": 0,
                    "mutual": false,
                    "expertTags": [
                        "电子",
                        "欧美"
                    ],
                    "experts": {
                        "1": "音乐视频达人",
                        "2": "电子|欧美音乐资讯达人"
                    },
                    "djStatus": 10,
                    "vipType": 11,
                    "remarkName": null,
                    "avatarImgIdStr": "109951165661336154",
                    "backgroundImgIdStr": "109951165698066572"
                },
                "urlInfo": {
                    "id": "4EF7A0400B7E12BD360FC709D93D23BC",
                    "url": "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/79FfijcQ_1993845547_shd.mp4?ts=1621611795&rid=37EEA6B6C99B4B35A2B055CABBBF4163&rl=3&rs=WQrfvwBAziuujfzEVnosLCYHRxRKGSCN&sign=c8fd449640f637a87ecc30b8217aefe0&ext=t0zqTPwcQrSITPzTAa7rHvEJefQ8rCfy%2B2uy5xgS0CQisi0n4LK3WpqS%2FGyS8idbvZzjjwStRMGmLecKy74FUNojO2fXh4PQ3JwVnZKFj%2Frjx%2FKbbfPyrMCsDzKcf9ai7yMPT4Ri61dXyLT8cTA2urzKwLopJbnjkgnWfxNeQtoMoIswkNpsPUcnfOhL4RH1ouOkkbbXmmi0RYC4k8%2BKoyaFME7dDB6w71kPZ%2BfULaRn8tShJPpAfzdkVC1%2FLXE%2B",
                    "size": 35340210,
                    "validityTime": 1200,
                    "needPay": false,
                    "payInfo": null,
                    "r": 720
                },
                "videoGroup": [
                    {
                        "id": 58100,
                        "name": "现场",
                        "alg": null
                    },
                    {
                        "id": 4101,
                        "name": "娱乐",
                        "alg": null
                    },
                    {
                        "id": 3101,
                        "name": "综艺",
                        "alg": null
                    },
                    {
                        "id": 75122,
                        "name": "欧美综艺",
                        "alg": null
                    },
                    {
                        "id": 76108,
                        "name": "综艺片段",
                        "alg": null
                    }
                ],
                "previewUrl": null,
                "previewDurationms": 0,
                "hasRelatedGameAd": false,
                "markTypes": null,
                "relateSong": [],
                "relatedInfo": null,
                "videoUserLiveInfo": null,
                "vid": "4EF7A0400B7E12BD360FC709D93D23BC",
                "durationms": 172920,
                "playTime": 6148363,
                "praisedCount": 38465,
                "praised": false,
                "subscribed": false
            }
        },
        {
            "type": 1,
            "displayed": false,
            "alg": "onlineHotGroup",
            "extAlg": null,
            "data": {
                "alg": "onlineHotGroup",
                "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
                "threadId": "R_VI_62_6B36F67D54FB89E6AA7B8000F5533A15",
                "coverUrl": "https://p2.music.126.net/U06AZDZICZJ2pJGPWwTgpw==/109951165386197062.jpg",
                "height": 1080,
                "width": 1920,
                "title": "【Triple H 泫雅】365 FRESH 打歌舞台",
                "description": "",
                "commentCount": 111,
                "shareCount": 154,
                "resolutions": [
                    {
                        "resolution": 240,
                        "size": 78138584
                    },
                    {
                        "resolution": 480,
                        "size": 131104193
                    },
                    {
                        "resolution": 720,
                        "size": 218310127
                    },
                    {
                        "resolution": 1080,
                        "size": 398650429
                    }
                ],
                "creator": {
                    "defaultAvatar": false,
                    "province": 310000,
                    "authStatus": 0,
                    "followed": false,
                    "avatarUrl": "http://p1.music.126.net/vYHGILLfWWof6ogz1HwxKQ==/109951164491145822.jpg",
                    "accountStatus": 0,
                    "gender": 2,
                    "city": 310101,
                    "birthday": 1262275200000,
                    "userId": 1335061865,
                    "userType": 204,
                    "nickname": "仙宫频道",
                    "signature": "",
                    "description": "",
                    "detailDescription": "",
                    "avatarImgId": 109951164491145820,
                    "backgroundImgId": 109951164829202080,
                    "backgroundUrl": "http://p1.music.126.net/PNGXsjXd_IYT0vvkXeoonQ==/109951164829202086.jpg",
                    "authority": 0,
                    "mutual": false,
                    "expertTags": null,
                    "experts": {
                        "1": "音乐视频达人",
                        "2": "音乐图文达人"
                    },
                    "djStatus": 10,
                    "vipType": 11,
                    "remarkName": null,
                    "avatarImgIdStr": "109951164491145822",
                    "backgroundImgIdStr": "109951164829202086"
                },
                "urlInfo": {
                    "id": "6B36F67D54FB89E6AA7B8000F5533A15",
                    "url": "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/aKGJHpWX_1599571517_uhd.mp4?ts=1621611795&rid=37EEA6B6C99B4B35A2B055CABBBF4163&rl=3&rs=dLXtsXtEfoxuJMGNTiBAkGdfjHLnjxQC&sign=d83b1e3b1fa5bdd6e939232a351497ff&ext=t0zqTPwcQrSITPzTAa7rHvEJefQ8rCfy%2B2uy5xgS0CQisi0n4LK3WpqS%2FGyS8idbvZzjjwStRMGmLecKy74FUNojO2fXh4PQ3JwVnZKFj%2Frjx%2FKbbfPyrMCsDzKcf9ai7yMPT4Ri61dXyLT8cTA2urzKwLopJbnjkgnWfxNeQtoMoIswkNpsPUcnfOhL4RH1ouOkkbbXmmi0RYC4k8%2BKoyaFME7dDB6w71kPZ%2BfULaRn8tShJPpAfzdkVC1%2FLXE%2B",
                    "size": 398650429,
                    "validityTime": 1200,
                    "needPay": false,
                    "payInfo": null,
                    "r": 1080
                },
                "videoGroup": [
                    {
                        "id": 58100,
                        "name": "现场",
                        "alg": null
                    },
                    {
                        "id": 1101,
                        "name": "舞蹈",
                        "alg": null
                    },
                    {
                        "id": 57107,
                        "name": "韩语现场",
                        "alg": null
                    },
                    {
                        "id": 57108,
                        "name": "流行现场",
                        "alg": null
                    },
                    {
                        "id": 57110,
                        "name": "饭拍现场",
                        "alg": null
                    },
                    {
                        "id": 1100,
                        "name": "音乐现场",
                        "alg": null
                    },
                    {
                        "id": 5100,
                        "name": "音乐",
                        "alg": null
                    }
                ],
                "previewUrl": null,
                "previewDurationms": 0,
                "hasRelatedGameAd": false,
                "markTypes": null,
                "relateSong": [],
                "relatedInfo": null,
                "videoUserLiveInfo": null,
                "vid": "6B36F67D54FB89E6AA7B8000F5533A15",
                "durationms": 219465,
                "playTime": 351234,
                "praisedCount": 1925,
                "praised": false,
                "subscribed": false
            }
        },
        {
            "type": 1,
            "displayed": false,
            "alg": "onlineHotGroup",
            "extAlg": null,
            "data": {
                "alg": "onlineHotGroup",
                "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
                "threadId": "R_VI_62_0AB8883A0EF5C6ED30E6B2A74583A02F",
                "coverUrl": "https://p1.music.126.net/ctnA9kgZbKmjNII9NMgNJg==/109951163572958392.jpg",
                "height": 720,
                "width": 1280,
                "title": "小贾和Ariana Grande同台合唱《As Long As You Love Me》",
                "description": "Justin Bieber和Ariana Grande同台合唱《As Long As You Love Me》无与伦比的现场，前奏一响起就醉了！[憨笑]",
                "commentCount": 1725,
                "shareCount": 1418,
                "resolutions": [
                    {
                        "resolution": 240,
                        "size": 27076274
                    },
                    {
                        "resolution": 480,
                        "size": 38639535
                    },
                    {
                        "resolution": 720,
                        "size": 61748633
                    }
                ],
                "creator": {
                    "defaultAvatar": false,
                    "province": 1000000,
                    "authStatus": 0,
                    "followed": false,
                    "avatarUrl": "http://p1.music.126.net/Fn4S3zBPuUtqbY33FXrc0g==/109951165661336154.jpg",
                    "accountStatus": 0,
                    "gender": 1,
                    "city": 1010000,
                    "birthday": 883929600000,
                    "userId": 347267113,
                    "userType": 204,
                    "nickname": "Dennnnnniel",
                    "signature": "看我男朋友的个人简介干嘛？:(",
                    "description": "",
                    "detailDescription": "",
                    "avatarImgId": 109951165661336160,
                    "backgroundImgId": 109951165698066580,
                    "backgroundUrl": "http://p1.music.126.net/QdqRMHtwWSEHvl4VkwRI0Q==/109951165698066572.jpg",
                    "authority": 0,
                    "mutual": false,
                    "expertTags": [
                        "电子",
                        "欧美"
                    ],
                    "experts": {
                        "1": "音乐视频达人",
                        "2": "电子|欧美音乐资讯达人"
                    },
                    "djStatus": 10,
                    "vipType": 11,
                    "remarkName": null,
                    "avatarImgIdStr": "109951165661336154",
                    "backgroundImgIdStr": "109951165698066572"
                },
                "urlInfo": {
                    "id": "0AB8883A0EF5C6ED30E6B2A74583A02F",
                    "url": "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/gffFyUIH_1288586801_shd.mp4?ts=1621611795&rid=37EEA6B6C99B4B35A2B055CABBBF4163&rl=3&rs=AxeAiyUzRixvnqJGlQtsuRbDUalaGRSW&sign=767ec8405cdd1ec83c130aadcb6f8bb1&ext=t0zqTPwcQrSITPzTAa7rHvEJefQ8rCfy%2B2uy5xgS0CQisi0n4LK3WpqS%2FGyS8idbvZzjjwStRMGmLecKy74FUNojO2fXh4PQ3JwVnZKFj%2Frjx%2FKbbfPyrMCsDzKcf9ai7yMPT4Ri61dXyLT8cTA2urzKwLopJbnjkgnWfxNeQtoMoIswkNpsPUcnfOhL4RH1ouOkkbbXmmi0RYC4k8%2BKoyaFME7dDB6w71kPZ%2BfULaRn8tShJPpAfzdkVC1%2FLXE%2B",
                    "size": 61748633,
                    "validityTime": 1200,
                    "needPay": false,
                    "payInfo": null,
                    "r": 720
                },
                "videoGroup": [
                    {
                        "id": 58100,
                        "name": "现场",
                        "alg": null
                    },
                    {
                        "id": 57106,
                        "name": "欧美现场",
                        "alg": null
                    },
                    {
                        "id": 57108,
                        "name": "流行现场",
                        "alg": null
                    },
                    {
                        "id": 57110,
                        "name": "饭拍现场",
                        "alg": null
                    },
                    {
                        "id": 1100,
                        "name": "音乐现场",
                        "alg": null
                    },
                    {
                        "id": 5100,
                        "name": "音乐",
                        "alg": null
                    },
                    {
                        "id": 16224,
                        "name": "Justin Bieber",
                        "alg": null
                    },
                    {
                        "id": 15211,
                        "name": "Ariana Grande",
                        "alg": null
                    }
                ],
                "previewUrl": null,
                "previewDurationms": 0,
                "hasRelatedGameAd": false,
                "markTypes": null,
                "relateSong": [
                    {
                        "name": "As Long As You Love Me",
                        "id": 25714173,
                        "pst": 0,
                        "t": 0,
                        "ar": [
                            {
                                "id": 35531,
                                "name": "Justin Bieber",
                                "tns": [],
                                "alias": []
                            }
                        ],
                        "alia": [],
                        "pop": 100,
                        "st": 0,
                        "rt": "600902000008000122",
                        "fee": 1,
                        "v": 30,
                        "crbt": null,
                        "cf": "",
                        "al": {
                            "id": 2290012,
                            "name": "Believe Acoustic",
                            "picUrl": "http://p3.music.126.net/JFRoULIpWFCLDCmOzxAmUA==/1769114209113309.jpg",
                            "tns": [],
                            "pic": 1769114209113309
                        },
                        "dt": 221693,
                        "h": {
                            "br": 320000,
                            "fid": 0,
                            "size": 8870182,
                            "vd": -39661
                        },
                        "m": {
                            "br": 192000,
                            "fid": 0,
                            "size": 5322127,
                            "vd": -37098
                        },
                        "l": {
                            "br": 128000,
                            "fid": 0,
                            "size": 3548099,
                            "vd": -35393
                        },
                        "a": null,
                        "cd": "1",
                        "no": 2,
                        "rtUrl": null,
                        "ftype": 0,
                        "rtUrls": [],
                        "djId": 0,
                        "copyright": 1,
                        "s_id": 0,
                        "rtype": 0,
                        "rurl": null,
                        "mst": 9,
                        "cp": 7003,
                        "mv": 0,
                        "publishTime": 1359388800007,
                        "privilege": {
                            "id": 25714173,
                            "fee": 1,
                            "payed": 1,
                            "st": 0,
                            "pl": 999000,
                            "dl": 999000,
                            "sp": 7,
                            "cp": 1,
                            "subp": 1,
                            "cs": false,
                            "maxbr": 999000,
                            "fl": 0,
                            "toast": false,
                            "flag": 1028,
                            "preSell": false
                        }
                    }
                ],
                "relatedInfo": null,
                "videoUserLiveInfo": null,
                "vid": "0AB8883A0EF5C6ED30E6B2A74583A02F",
                "durationms": 231015,
                "playTime": 4569483,
                "praisedCount": 19440,
                "praised": false,
                "subscribed": false
            }
        },
        {
            "type": 1,
            "displayed": false,
            "alg": "onlineHotGroup",
            "extAlg": null,
            "data": {
                "alg": "onlineHotGroup",
                "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
                "threadId": "R_VI_62_2780354C29B95443F8C3664E0F9CF3F5",
                "coverUrl": "https://p1.music.126.net/0bPtu8DsVqN3bvpEjtB4LA==/109951163572668059.jpg",
                "height": 720,
                "width": 1280,
                "title": "逃跑计划《夜空中最亮的星》，不怎么好听，我也就听了七百多遍",
                "description": "逃跑计划《夜空中最亮的星》，不怎么好听，我也就听了七百多遍而已",
                "commentCount": 525,
                "shareCount": 1136,
                "resolutions": [
                    {
                        "resolution": 240,
                        "size": 33147558
                    },
                    {
                        "resolution": 480,
                        "size": 47359607
                    },
                    {
                        "resolution": 720,
                        "size": 75835347
                    }
                ],
                "creator": {
                    "defaultAvatar": false,
                    "province": 110000,
                    "authStatus": 0,
                    "followed": false,
                    "avatarUrl": "http://p1.music.126.net/5WuEwQsJpxqmJekOWEto-g==/109951165328068724.jpg",
                    "accountStatus": 0,
                    "gender": 1,
                    "city": 110101,
                    "birthday": 1483200000000,
                    "userId": 473551421,
                    "userType": 204,
                    "nickname": "这音乐牛掰",
                    "signature": "为人低调的音乐博主，投稿请私信",
                    "description": "",
                    "detailDescription": "",
                    "avatarImgId": 109951165328068720,
                    "backgroundImgId": 109951163462909980,
                    "backgroundUrl": "http://p1.music.126.net/z4p1vQpYXhjk8x0ZSQM_jQ==/109951163462909982.jpg",
                    "authority": 0,
                    "mutual": false,
                    "expertTags": null,
                    "experts": {
                        "1": "音乐视频达人"
                    },
                    "djStatus": 0,
                    "vipType": 11,
                    "remarkName": null,
                    "avatarImgIdStr": "109951165328068724",
                    "backgroundImgIdStr": "109951163462909982"
                },
                "urlInfo": {
                    "id": "2780354C29B95443F8C3664E0F9CF3F5",
                    "url": "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/tjSmA5EG_22727388_shd.mp4?ts=1621611795&rid=37EEA6B6C99B4B35A2B055CABBBF4163&rl=3&rs=rOjiMLMaJQHcUzANrKkTJkDWlXeSsXND&sign=10836dd4d6e6741da00727df0dbfd79a&ext=t0zqTPwcQrSITPzTAa7rHvEJefQ8rCfy%2B2uy5xgS0CQisi0n4LK3WpqS%2FGyS8idbvZzjjwStRMGmLecKy74FUNojO2fXh4PQ3JwVnZKFj%2Frjx%2FKbbfPyrMCsDzKcf9ai7yMPT4Ri61dXyLT8cTA2urzKwLopJbnjkgnWfxNeQtoMoIswkNpsPUcnfOhL4RH1ouOkkbbXmmi0RYC4k8%2BKoyaFME7dDB6w71kPZ%2BfULaRn8tShJPpAfzdkVC1%2FLXE%2B",
                    "size": 75835347,
                    "validityTime": 1200,
                    "needPay": false,
                    "payInfo": null,
                    "r": 720
                },
                "videoGroup": [
                    {
                        "id": 58100,
                        "name": "现场",
                        "alg": null
                    },
                    {
                        "id": 59101,
                        "name": "华语现场",
                        "alg": null
                    },
                    {
                        "id": 57108,
                        "name": "流行现场",
                        "alg": null
                    },
                    {
                        "id": 1100,
                        "name": "音乐现场",
                        "alg": null
                    },
                    {
                        "id": 5100,
                        "name": "音乐",
                        "alg": null
                    }
                ],
                "previewUrl": null,
                "previewDurationms": 0,
                "hasRelatedGameAd": false,
                "markTypes": null,
                "relateSong": [
                    {
                        "name": "夜空中最亮的星",
                        "id": 25706282,
                        "pst": 0,
                        "t": 0,
                        "ar": [
                            {
                                "id": 12977,
                                "name": "逃跑计划",
                                "tns": [],
                                "alias": []
                            }
                        ],
                        "alia": [],
                        "pop": 100,
                        "st": 0,
                        "rt": "600902000009535440",
                        "fee": 8,
                        "v": 125,
                        "crbt": null,
                        "cf": "",
                        "al": {
                            "id": 2285010,
                            "name": "世界",
                            "picUrl": "http://p4.music.126.net/Eef2K2KV9dT3XUA6_Ve-Rw==/109951165543196748.jpg",
                            "tns": [],
                            "pic_str": "109951165543196748",
                            "pic": 109951165543196750
                        },
                        "dt": 252000,
                        "h": {
                            "br": 320000,
                            "fid": 0,
                            "size": 10091667,
                            "vd": -3700
                        },
                        "m": {
                            "br": 192000,
                            "fid": 0,
                            "size": 6055017,
                            "vd": -1200
                        },
                        "l": {
                            "br": 128000,
                            "fid": 0,
                            "size": 4036692,
                            "vd": -2
                        },
                        "a": null,
                        "cd": "1",
                        "no": 7,
                        "rtUrl": null,
                        "ftype": 0,
                        "rtUrls": [],
                        "djId": 0,
                        "copyright": 1,
                        "s_id": 0,
                        "rtype": 0,
                        "rurl": null,
                        "mst": 9,
                        "cp": 22036,
                        "mv": 382555,
                        "publishTime": 1325347200007,
                        "privilege": {
                            "id": 25706282,
                            "fee": 8,
                            "payed": 1,
                            "st": 0,
                            "pl": 999000,
                            "dl": 999000,
                            "sp": 7,
                            "cp": 1,
                            "subp": 1,
                            "cs": false,
                            "maxbr": 999000,
                            "fl": 128000,
                            "toast": false,
                            "flag": 260,
                            "preSell": false
                        }
                    }
                ],
                "relatedInfo": null,
                "videoUserLiveInfo": null,
                "vid": "2780354C29B95443F8C3664E0F9CF3F5",
                "durationms": 279720,
                "playTime": 1492837,
                "praisedCount": 6154,
                "praised": false,
                "subscribed": false
            }
        },
        {
            "type": 1,
            "displayed": false,
            "alg": "onlineHotGroup",
            "extAlg": null,
            "data": {
                "alg": "onlineHotGroup",
                "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
                "threadId": "R_VI_62_82AEC34ED0D914AC3873542503934005",
                "coverUrl": "https://p2.music.126.net/b25Z4AbHrPLuO1VokdXuGQ==/109951165441279520.jpg",
                "height": 1080,
                "width": 1920,
                "title": "有一种美叫米兰达可儿Miranda Kerr，维多利亚的秘密合辑。",
                "description": "有一种美叫米兰达可儿Miranda Kerr，维多利亚的秘密合辑。",
                "commentCount": 111,
                "shareCount": 230,
                "resolutions": [
                    {
                        "resolution": 240,
                        "size": 39472687
                    },
                    {
                        "resolution": 480,
                        "size": 67238588
                    },
                    {
                        "resolution": 720,
                        "size": 98460722
                    },
                    {
                        "resolution": 1080,
                        "size": 136010410
                    }
                ],
                "creator": {
                    "defaultAvatar": false,
                    "province": 450000,
                    "authStatus": 0,
                    "followed": false,
                    "avatarUrl": "http://p1.music.126.net/6aH61D-vK2cNkjjg4EszXg==/109951165303381773.jpg",
                    "accountStatus": 0,
                    "gender": 1,
                    "city": 450100,
                    "birthday": 692121600000,
                    "userId": 265449953,
                    "userType": 204,
                    "nickname": "John_分享_",
                    "signature": "善良，无畏，谦卑，纯粹。",
                    "description": "",
                    "detailDescription": "",
                    "avatarImgId": 109951165303381780,
                    "backgroundImgId": 109951165829677950,
                    "backgroundUrl": "http://p1.music.126.net/U7TzsQs_kp5T7j26wPhlaQ==/109951165829677944.jpg",
                    "authority": 0,
                    "mutual": false,
                    "expertTags": null,
                    "experts": {
                        "1": "泛生活视频达人"
                    },
                    "djStatus": 10,
                    "vipType": 0,
                    "remarkName": null,
                    "avatarImgIdStr": "109951165303381773",
                    "backgroundImgIdStr": "109951165829677944"
                },
                "urlInfo": {
                    "id": "82AEC34ED0D914AC3873542503934005",
                    "url": "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/06BZQH4v_2270557900_uhd.mp4?ts=1621611795&rid=37EEA6B6C99B4B35A2B055CABBBF4163&rl=3&rs=EXfVYdDIrMXZEqYgvpNnxYEUpAPgsJqT&sign=e56114d02af0853a8881efb263e0bece&ext=t0zqTPwcQrSITPzTAa7rHvEJefQ8rCfy%2B2uy5xgS0CQisi0n4LK3WpqS%2FGyS8idbvZzjjwStRMGmLecKy74FUNojO2fXh4PQ3JwVnZKFj%2Frjx%2FKbbfPyrMCsDzKcf9ai7yMPT4Ri61dXyLT8cTA2urzKwLopJbnjkgnWfxNeQtoMoIswkNpsPUcnfOhL4RH1ouOkkbbXmmi0RYC4k8%2BKoyaFME7dDB6w71kPZ%2BfULaRn8tShJPpAfzdkVC1%2FLXE%2B",
                    "size": 136010410,
                    "validityTime": 1200,
                    "needPay": false,
                    "payInfo": null,
                    "r": 1080
                },
                "videoGroup": [
                    {
                        "id": 58100,
                        "name": "现场",
                        "alg": null
                    },
                    {
                        "id": 57106,
                        "name": "欧美现场",
                        "alg": null
                    },
                    {
                        "id": 57108,
                        "name": "流行现场",
                        "alg": null
                    },
                    {
                        "id": 59108,
                        "name": "巡演现场",
                        "alg": null
                    },
                    {
                        "id": 1100,
                        "name": "音乐现场",
                        "alg": null
                    },
                    {
                        "id": 5100,
                        "name": "音乐",
                        "alg": null
                    }
                ],
                "previewUrl": null,
                "previewDurationms": 0,
                "hasRelatedGameAd": false,
                "markTypes": null,
                "relateSong": [],
                "relatedInfo": null,
                "videoUserLiveInfo": null,
                "vid": "82AEC34ED0D914AC3873542503934005",
                "durationms": 260575,
                "playTime": 366408,
                "praisedCount": 1668,
                "praised": false,
                "subscribed": false
            }
        },
        {
            "type": 1,
            "displayed": false,
            "alg": "onlineHotGroup",
            "extAlg": null,
            "data": {
                "alg": "onlineHotGroup",
                "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
                "threadId": "R_VI_62_3B288486D563C9D8CF80D29F2C7A622F",
                "coverUrl": "https://p2.music.126.net/MGhYFQC_xCxrWHXjloCJWg==/109951163970396320.jpg",
                "height": 1080,
                "width": 1920,
                "title": "碧梨最新做客艾伦秀现场演唱《When The Party's Over》！",
                "description": "#Billie Eilish#\n碧梨最新做客艾伦秀现场演唱《When The Party's Over》！",
                "commentCount": 67,
                "shareCount": 97,
                "resolutions": [
                    {
                        "resolution": 240,
                        "size": 14132413
                    },
                    {
                        "resolution": 480,
                        "size": 24943235
                    },
                    {
                        "resolution": 720,
                        "size": 36440293
                    },
                    {
                        "resolution": 1080,
                        "size": 62219937
                    }
                ],
                "creator": {
                    "defaultAvatar": false,
                    "province": 320000,
                    "authStatus": 1,
                    "followed": false,
                    "avatarUrl": "http://p1.music.126.net/29V_TvOcg8VPvGOyRQf9nw==/109951165482189661.jpg",
                    "accountStatus": 0,
                    "gender": 1,
                    "city": 320100,
                    "birthday": 788112000000,
                    "userId": 109093293,
                    "userType": 10,
                    "nickname": "萌德不萌",
                    "signature": "zzy1025071687（vx）合作推广",
                    "description": "欧美音乐资讯号",
                    "detailDescription": "欧美音乐资讯号",
                    "avatarImgId": 109951165482189660,
                    "backgroundImgId": 109951165988215120,
                    "backgroundUrl": "http://p1.music.126.net/Kj4fYKku-4iPe0VhNpgLcg==/109951165988215119.jpg",
                    "authority": 0,
                    "mutual": false,
                    "expertTags": [
                        "华语",
                        "电子",
                        "欧美"
                    ],
                    "experts": {
                        "2": "欧美音乐资讯达人"
                    },
                    "djStatus": 10,
                    "vipType": 11,
                    "remarkName": null,
                    "avatarImgIdStr": "109951165482189661",
                    "backgroundImgIdStr": "109951165988215119"
                },
                "urlInfo": {
                    "id": "3B288486D563C9D8CF80D29F2C7A622F",
                    "url": "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/8SL9ZA1P_2418625269_uhd.mp4?ts=1621611795&rid=37EEA6B6C99B4B35A2B055CABBBF4163&rl=3&rs=KeiRlqfxrADuIdgiCjPCHtEKNiKuZUyj&sign=eb61706503e88705c6458adcdf52f1db&ext=t0zqTPwcQrSITPzTAa7rHvEJefQ8rCfy%2B2uy5xgS0CQisi0n4LK3WpqS%2FGyS8idbvZzjjwStRMGmLecKy74FUNojO2fXh4PQ3JwVnZKFj%2Frjx%2FKbbfPyrMCsDzKcf9ai7yMPT4Ri61dXyLT8cTA2urzKwLopJbnjkgnWfxNeQtoMoIswkNpsPUcnfOhL4RH1ouOkkbbXmmi0RYC4k8%2BKoyaFME7dDB6w71kPZ%2BfULaRn8tShJPpAfzdkVC1%2FLXE%2B",
                    "size": 62219937,
                    "validityTime": 1200,
                    "needPay": false,
                    "payInfo": null,
                    "r": 1080
                },
                "videoGroup": [
                    {
                        "id": 58100,
                        "name": "现场",
                        "alg": null
                    },
                    {
                        "id": 57106,
                        "name": "欧美现场",
                        "alg": null
                    },
                    {
                        "id": 57108,
                        "name": "流行现场",
                        "alg": null
                    },
                    {
                        "id": 59108,
                        "name": "巡演现场",
                        "alg": null
                    },
                    {
                        "id": 1100,
                        "name": "音乐现场",
                        "alg": null
                    },
                    {
                        "id": 5100,
                        "name": "音乐",
                        "alg": null
                    },
                    {
                        "id": 102113,
                        "name": "Billie Eilish",
                        "alg": null
                    }
                ],
                "previewUrl": null,
                "previewDurationms": 0,
                "hasRelatedGameAd": false,
                "markTypes": null,
                "relateSong": [
                    {
                        "name": "when the party's over",
                        "id": 1355149438,
                        "pst": 0,
                        "t": 0,
                        "ar": [
                            {
                                "id": 11972054,
                                "name": "Billie Eilish",
                                "tns": [],
                                "alias": []
                            }
                        ],
                        "alia": [],
                        "pop": 100,
                        "st": 0,
                        "rt": "",
                        "fee": 8,
                        "v": 17,
                        "crbt": null,
                        "cf": "",
                        "al": {
                            "id": 78243642,
                            "name": "WHEN WE ALL FALL ASLEEP, WHERE DO WE GO?",
                            "picUrl": "http://p4.music.126.net/ARn_7WFEy81bwiDwwgm2AA==/109951163959066909.jpg",
                            "tns": [],
                            "pic_str": "109951163959066909",
                            "pic": 109951163959066910
                        },
                        "dt": 196077,
                        "h": {
                            "br": 320000,
                            "fid": 0,
                            "size": 7846182,
                            "vd": -40220
                        },
                        "m": {
                            "br": 192000,
                            "fid": 0,
                            "size": 4707727,
                            "vd": -37586
                        },
                        "l": {
                            "br": 128000,
                            "fid": 0,
                            "size": 3138499,
                            "vd": -35803
                        },
                        "a": null,
                        "cd": "01",
                        "no": 7,
                        "rtUrl": null,
                        "ftype": 0,
                        "rtUrls": [],
                        "djId": 0,
                        "copyright": 1,
                        "s_id": 0,
                        "rtype": 0,
                        "rurl": null,
                        "mst": 9,
                        "cp": 7003,
                        "mv": 10823087,
                        "publishTime": 1553788800000,
                        "privilege": {
                            "id": 1355149438,
                            "fee": 8,
                            "payed": 1,
                            "st": 0,
                            "pl": 999000,
                            "dl": 999000,
                            "sp": 7,
                            "cp": 1,
                            "subp": 1,
                            "cs": false,
                            "maxbr": 999000,
                            "fl": 128000,
                            "toast": false,
                            "flag": 4,
                            "preSell": false
                        }
                    }
                ],
                "relatedInfo": null,
                "videoUserLiveInfo": null,
                "vid": "3B288486D563C9D8CF80D29F2C7A622F",
                "durationms": 236031,
                "playTime": 166364,
                "praisedCount": 1960,
                "praised": false,
                "subscribed": false
            }
        },
        {
            "type": 1,
            "displayed": false,
            "alg": "onlineHotGroup",
            "extAlg": null,
            "data": {
                "alg": "onlineHotGroup",
                "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
                "threadId": "R_VI_62_23D954F2109FEB4A12656248091429A6",
                "coverUrl": "https://p2.music.126.net/noImwUgH1u8HwdU7pfKFVQ==/109951163845238517.jpg",
                "height": 1080,
                "width": 1920,
                "title": "【少女时代】140315 少女时代 Mr. Mr.现场舞台",
                "description": "【少女时代】140315 少女时代 Mr. Mr.现场舞台",
                "commentCount": 43,
                "shareCount": 36,
                "resolutions": [
                    {
                        "resolution": 240,
                        "size": 69487281
                    },
                    {
                        "resolution": 480,
                        "size": 126003959
                    },
                    {
                        "resolution": 720,
                        "size": 198871478
                    },
                    {
                        "resolution": 1080,
                        "size": 270509662
                    }
                ],
                "creator": {
                    "defaultAvatar": false,
                    "province": 310000,
                    "authStatus": 0,
                    "followed": false,
                    "avatarUrl": "http://p1.music.126.net/PfAjGOrYTepLWBELSrhSWg==/109951163981832642.jpg",
                    "accountStatus": 0,
                    "gender": 2,
                    "city": 310101,
                    "birthday": 848419200000,
                    "userId": 35672686,
                    "userType": 204,
                    "nickname": "Kpop现场舞台",
                    "signature": "更新现场舞台、混剪视频等，喜欢就关注吧，欢迎私信聊骚。",
                    "description": "",
                    "detailDescription": "",
                    "avatarImgId": 109951163981832640,
                    "backgroundImgId": 109951165714879600,
                    "backgroundUrl": "http://p1.music.126.net/5H-kzFjtvbnM2XvdsQ49Mw==/109951165714879604.jpg",
                    "authority": 0,
                    "mutual": false,
                    "expertTags": null,
                    "experts": {
                        "1": "舞蹈视频达人"
                    },
                    "djStatus": 10,
                    "vipType": 0,
                    "remarkName": null,
                    "avatarImgIdStr": "109951163981832642",
                    "backgroundImgIdStr": "109951165714879604"
                },
                "urlInfo": {
                    "id": "23D954F2109FEB4A12656248091429A6",
                    "url": "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/RD5Bav2g_2302375113_uhd.mp4?ts=1621611795&rid=37EEA6B6C99B4B35A2B055CABBBF4163&rl=3&rs=IxMhZhZbMHSzfiEJvzzxHCQqdKbIFNHF&sign=f36006d2d4f8dc271f250d0b98c46c84&ext=t0zqTPwcQrSITPzTAa7rHvEJefQ8rCfy%2B2uy5xgS0CQisi0n4LK3WpqS%2FGyS8idbvZzjjwStRMGmLecKy74FUNojO2fXh4PQ3JwVnZKFj%2Frjx%2FKbbfPyrMCsDzKcf9ai7yMPT4Ri61dXyLT8cTA2urzKwLopJbnjkgnWfxNeQtoMoIswkNpsPUcnfOhL4RH1ouOkkbbXmmi0RYC4k8%2BKoyaFME7dDB6w71kPZ%2BfULaRn8tShJPpAfzdkVC1%2FLXE%2B",
                    "size": 270509662,
                    "validityTime": 1200,
                    "needPay": false,
                    "payInfo": null,
                    "r": 1080
                },
                "videoGroup": [
                    {
                        "id": 58100,
                        "name": "现场",
                        "alg": null
                    },
                    {
                        "id": 1101,
                        "name": "舞蹈",
                        "alg": null
                    },
                    {
                        "id": 57107,
                        "name": "韩语现场",
                        "alg": null
                    },
                    {
                        "id": 57108,
                        "name": "流行现场",
                        "alg": null
                    },
                    {
                        "id": 59108,
                        "name": "巡演现场",
                        "alg": null
                    },
                    {
                        "id": 1100,
                        "name": "音乐现场",
                        "alg": null
                    },
                    {
                        "id": 5100,
                        "name": "音乐",
                        "alg": null
                    }
                ],
                "previewUrl": null,
                "previewDurationms": 0,
                "hasRelatedGameAd": false,
                "markTypes": null,
                "relateSong": [],
                "relatedInfo": null,
                "videoUserLiveInfo": null,
                "vid": "23D954F2109FEB4A12656248091429A6",
                "durationms": 231503,
                "playTime": 116387,
                "praisedCount": 638,
                "praised": false,
                "subscribed": false
            }
        },
        {
            "type": 1,
            "displayed": false,
            "alg": "onlineHotGroup",
            "extAlg": null,
            "data": {
                "alg": "onlineHotGroup",
                "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
                "threadId": "R_VI_62_B4E3E42C167A00289413E753A4DEAB26",
                "coverUrl": "https://p2.music.126.net/thlvrKHDyVcS5sYxohbpgw==/109951163891816009.jpg",
                "height": 1080,
                "width": 1920,
                "title": "Lian Ross - Say You'll Never (Moscow Live)",
                "description": "",
                "commentCount": 84,
                "shareCount": 896,
                "resolutions": [
                    {
                        "resolution": 240,
                        "size": 73269784
                    },
                    {
                        "resolution": 480,
                        "size": 155404794
                    },
                    {
                        "resolution": 720,
                        "size": 223111227
                    },
                    {
                        "resolution": 1080,
                        "size": 273002828
                    }
                ],
                "creator": {
                    "defaultAvatar": false,
                    "province": 440000,
                    "authStatus": 0,
                    "followed": false,
                    "avatarUrl": "http://p1.music.126.net/xCs2UyS-7M2-b_x4ROOTHQ==/109951165780501724.jpg",
                    "accountStatus": 0,
                    "gender": 1,
                    "city": 440100,
                    "birthday": 12067200000,
                    "userId": 6416788,
                    "userType": 0,
                    "nickname": "ChannelFelix0521",
                    "signature": "MV疯子",
                    "description": "",
                    "detailDescription": "",
                    "avatarImgId": 109951165780501730,
                    "backgroundImgId": 109951163038323950,
                    "backgroundUrl": "http://p1.music.126.net/_IVBPrIpAsQHK8olEfs4dg==/109951163038323954.jpg",
                    "authority": 0,
                    "mutual": false,
                    "expertTags": null,
                    "experts": null,
                    "djStatus": 0,
                    "vipType": 11,
                    "remarkName": null,
                    "avatarImgIdStr": "109951165780501724",
                    "backgroundImgIdStr": "109951163038323954"
                },
                "urlInfo": {
                    "id": "B4E3E42C167A00289413E753A4DEAB26",
                    "url": "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/RGBh8J4h_2341586580_uhd.mp4?ts=1621611795&rid=37EEA6B6C99B4B35A2B055CABBBF4163&rl=3&rs=dFAWieUokWBodpkkkxLfpbfVGZAdpktb&sign=ff42548b20852dcc0c3f12fed0ca3933&ext=t0zqTPwcQrSITPzTAa7rHvEJefQ8rCfy%2B2uy5xgS0CQisi0n4LK3WpqS%2FGyS8idbvZzjjwStRMGmLecKy74FUNojO2fXh4PQ3JwVnZKFj%2Frjx%2FKbbfPyrMCsDzKcf9ai7yMPT4Ri61dXyLT8cTA2urzKwLopJbnjkgnWfxNeQtoMoIswkNpsPUcnfOhL4RH1ouOkkbbXmmi0RYC4k8%2BKoyaFME7dDB6w71kPZ%2BfULaRn8tShJPpAfzdkVC1%2FLXE%2B",
                    "size": 273002828,
                    "validityTime": 1200,
                    "needPay": false,
                    "payInfo": null,
                    "r": 1080
                },
                "videoGroup": [
                    {
                        "id": 58100,
                        "name": "现场",
                        "alg": null
                    },
                    {
                        "id": 9102,
                        "name": "演唱会",
                        "alg": null
                    },
                    {
                        "id": 57106,
                        "name": "欧美现场",
                        "alg": null
                    },
                    {
                        "id": 57108,
                        "name": "流行现场",
                        "alg": null
                    },
                    {
                        "id": 1100,
                        "name": "音乐现场",
                        "alg": null
                    },
                    {
                        "id": 5100,
                        "name": "音乐",
                        "alg": null
                    }
                ],
                "previewUrl": null,
                "previewDurationms": 0,
                "hasRelatedGameAd": false,
                "markTypes": null,
                "relateSong": [
                    {
                        "name": "SAY YOU'LL NEVER",
                        "id": 5283119,
                        "pst": 0,
                        "t": 0,
                        "ar": [
                            {
                                "id": 66014,
                                "name": "Lian Ross",
                                "tns": [],
                                "alias": []
                            }
                        ],
                        "alia": [],
                        "pop": 85,
                        "st": 0,
                        "rt": "",
                        "fee": 0,
                        "v": 670,
                        "crbt": null,
                        "cf": "",
                        "al": {
                            "id": 513806,
                            "name": "荷东1",
                            "picUrl": "http://p4.music.126.net/70Ent0ues6Q21Z9UzTqAVQ==/74766790705107.jpg",
                            "tns": [],
                            "pic": 74766790705107
                        },
                        "dt": 262000,
                        "h": {
                            "br": 320000,
                            "fid": 0,
                            "size": 10482460,
                            "vd": 1710
                        },
                        "m": {
                            "br": 192000,
                            "fid": 0,
                            "size": 6289493,
                            "vd": 3552
                        },
                        "l": {
                            "br": 128000,
                            "fid": 0,
                            "size": 4193010,
                            "vd": 5473
                        },
                        "a": null,
                        "cd": "1",
                        "no": 2,
                        "rtUrl": null,
                        "ftype": 0,
                        "rtUrls": [],
                        "djId": 0,
                        "copyright": 2,
                        "s_id": 0,
                        "rtype": 0,
                        "rurl": null,
                        "mst": 9,
                        "cp": 0,
                        "mv": 0,
                        "publishTime": 688060800000,
                        "privilege": {
                            "id": 5283119,
                            "fee": 0,
                            "payed": 0,
                            "st": 0,
                            "pl": 999000,
                            "dl": 999000,
                            "sp": 7,
                            "cp": 1,
                            "subp": 1,
                            "cs": false,
                            "maxbr": 999000,
                            "fl": 320000,
                            "toast": false,
                            "flag": 128,
                            "preSell": false
                        }
                    }
                ],
                "relatedInfo": null,
                "videoUserLiveInfo": null,
                "vid": "B4E3E42C167A00289413E753A4DEAB26",
                "durationms": 356380,
                "playTime": 160758,
                "praisedCount": 730,
                "praised": false,
                "subscribed": false
            }
        }]
    let videoList=this.data.videoList
    //将视频最新的数据更新原有视频列表数据中
    videoList.push(...newVideoList)
    this.setData({
      videoList
    })
  },

  //跳转至搜索界面
  toSearch(){
      wx.navigateTo({
          url: '/pages/search/search',
      })
  },
  
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    console.log('页面的下拉刷新');
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    console.log('页面的上拉触底');
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: ({from}) => {
    console.log(from);
    if (from==='button') {
      return{
      title:'来自 button 的转发',
      page:'/pages/Video/video',
      imageUrl:'/static/images/nvsheng.jpg'
      }
    }else{
      return{
      title:'来自 menu 的转发',
      page:'/pages/Video/video',
      imageUrl:'/static/images/nvsheng.jpg'
      }
    }
  }
})