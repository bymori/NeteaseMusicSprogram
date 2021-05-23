/*
 * @Descripttion:
 * @version:
 * @Author: by_mori
 * @Date: 2021-05-22 15:49:59
 * @LastEditors: by_mori
 * @LastEditTime: 2021-05-23 10:33:02
 */
import PubSub from 'pubsub-js';
import moment from 'moment';
const { default: request } = require('../../utils/request');
const appInstance = getApp();
// pages/songDetail/songDetail.js
Page({
    /**
     * 页面的初始数据
     */
    data: {
        isPlay: false, //音乐是否播放
        song: {}, //歌曲详情对象
        musicId: '', //音乐id
        musicLink: '', //音乐链接
        currentTime: '00:00', //实时时间
        durationTime: '00:00', //总时长
        currentWidth:0, //音乐 实时时长
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        //options 用于接收 路由跳转的 query 参数
        //原生小程序中路由传参，对参数的长度有限制，如果参数长度过长会自动截取掉
        //console.log(typeof options.song);
        //console.log(options.song);
        //console.log(JSON.parse(options.song));

        let musicId = options.musicId;
        this.setData({
            musicId,
        });
        //console.log(options);
        //console.log(musicId);
        //获取音乐详情
        this.getMusicInfo(musicId);

        /*
         * 问题： 用户操作系统的控制音乐播放/暂停的按钮 页面不知道 导致页面显示是否播放的状态和真实的音乐播放状态不一致
         * 解决：
         *   1.通过控制音频 backgroundAudioManager 的实例去监视音乐 播放/暂停
         */

        //判断当前页音乐是否在播放
        if (
            appInstance.globalData.isMusicPlay &&
            appInstance.globalData.musicId === musicId
        ) {
            this.setData({
                isPlay: true,
            });
        }

        //创建控制播放音乐的实例
        this.backgroundAudioManager = wx.getBackgroundAudioManager();
        //监视音乐 播放/暂停
        this.backgroundAudioManager.onPlay(() => {
            this.changePlayState(true);
            //修改全局音乐播放状态
            appInstance.globalData.musicId = musicId;
        });
        this.backgroundAudioManager.onPause(() => {
            this.changePlayState(false);
        });
        this.backgroundAudioManager.onStop(() => {
            this.changePlayState(false);
        });

        //监听音乐播放自然结束
        this.backgroundAudioManager.onEnded(()=>{
            //自动切换至下一首音乐 并且自动播放
            //PubSub.publish('switchType','next')
            PubSub.publish('switchType', 'next');
            //将实时进度条的长度还原成0 时间还原为0
            this.setData({
                currentWidth:0,currentTime:'00:00'
            })
        })

        //监听音乐实时播放的进度
        this.backgroundAudioManager.onTimeUpdate(()=>{
            //console.log('总时长：', this.backgroundAudioManager.duration);
            //console.log('实时时长：', this.backgroundAudioManager.currentTime);

            //格式化 实时的播放时长
            let currentTime = moment(
                this.backgroundAudioManager.currentTime*1000
            ).format('mm:ss');
            let currentWidth = this.backgroundAudioManager.currentTime/this.backgroundAudioManager.duration *450;
            /* let currentWidth =
                (this.backgroundAudioManager.currentTime /
                    this.backgroundAudioManager.duration) *
                10; */
            this.setData({
                currentTime,
                currentWidth,
            });
        })
    },

    //修改播放状态的功能函数
    changePlayState(isPlay) {
        this.setData({
            isPlay,
        });
        //修改全局音乐播放状态
        appInstance.globalData.isMusicPlay = isPlay;
    },

    //获取音乐详情的功能函数
    async getMusicInfo(musicId) {
        let songData = await request('/song/detail', { ids: musicId });
        //songData.songs[0].dt 总时长 单位ms
        let durationTime = moment(songData.songs[0].dt).format('mm:ss');
        //console.log(durationTime);
        this.setData({
            song: songData.songs[0],
            durationTime,
        });

        //动态修改窗口标题为 音乐名称
        wx.setNavigationBarTitle({
            title: this.data.song.name,
        });
    },

    //点击 播放/暂停 音乐的回调
    handleMusicPlay() {
        let isPlay = !this.data.isPlay;
        ////修改是否播放状态
        //this.setData({
        //    isPlay,
        //});

        let { musicId, musicLink } = this.data;
        this.musicControl(isPlay, musicId, musicLink);
    },

    //控制音乐播放/暂停的功能
    async musicControl(isPlay, musicId, musicLink) {
        //创建控制播放音乐的实例
        //let backgroundAudioManager = wx.getBackgroundAudioManager();
        if (isPlay) {
            //播放音乐
            if (!musicLink) {
                //获取音乐播放地址
                let musicLinkData = await request('/song/url', { id: musicId });
                //console.log(musicLinkData);
                musicLink = musicLinkData.data[0].url;

                this.setData({
                    musicLink,
                });
            }

            //backgroundAudioManager.src=musicLink
            this.backgroundAudioManager.src = musicLink;
            this.backgroundAudioManager.src = musicLink;
            this.backgroundAudioManager.title = this.data.song.name;
        } else {
            //暂停音乐
            this.backgroundAudioManager.pause();
        }
        //更新 Data显示 音乐id
        this.setData({
            musicId,
        });
    },

    //点击切歌的函数 上一曲 下一曲
    handleSwitch(event) {
        //获取 切歌类型 pre next
        //let type = event.currentTarget.id;
        let type = event.currentTarget.id;

        //点击切换 关闭当前正在播放的音乐
        this.backgroundAudioManager.stop();

        //订阅来自 recommendSong 页面发布的musicId信息
        PubSub.subscribe('musicId', (msg, musicId) => {
            console.log(musicId);

            //获取音乐详情信息
            this.getMusicInfo(musicId);

            //点击 上一首 下一首 自动播放音乐
            this.musicControl(true, musicId);
            //取消订阅
            PubSub.unsubscribe('musicId');
        });
        //发布消息数据给 recommendSong 页面
        //console.log('switchType', type);
        PubSub.publish('switchType', type);
    },
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {},

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {},

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {},

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {},

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {},

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {},

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {},
});
