/*
 * @Descripttion:
 * @version:
 * @Author: by_mori
 * @Date: 2021-05-21 23:22:16
 * @LastEditors: by_mori
 * @LastEditTime: 2021-05-23 08:38:45
 */
// pages/RecommendedSong/RecommendedSong.js
//import request from '../../utils/request'
import PubSub from 'pubsub-js';
import request from '../../utils/request';
Page({
    /**
     * 页面的初始数据
     */
    data: {
        day: '', //天
        month: '', //月
        recommendList: [], // 推荐列表数据
        index: 0, //点击音乐的下标
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        //判断用户是否登录
        let userInfo = wx.getStorageSync('userInfo');
        if (!userInfo) {
            wx.showToast({
                title: '请先登录哦',
                icon: 'none',
                duration: 2000,
                success: () => {
                    //跳转至登录界面
                    wx.reLaunch({
                        url: '/pages/login/login',
                    });
                },
            });
        }
        //更新日期的状态数据
        this.setData({
            day: new Date().getDate(),
            month: new Date().getMonth() + 1,
        });

        // 获取每日推荐的数据
        this.getRecommendList();

        //订阅来自 songDetail 页面发布的信息
        PubSub.subscribe('switchType', (msg, type) => {
            let { recommendList, index } = this.data;
            if (type === 'pre') {
                //上一首
                //index = index - 1;
                index === 0 && (index = recommendList.length);
                index -= 1;
            } else {
                //下一首
                index === recommendList.length - 1 && (index = -1);
                index += 1;
            }

            //更新 下标
            this.setData({
                index,
            });

            let musicId = recommendList[index].id;
            // 将 musicId 回传给 songDetail 页面
            PubSub.publish('musicId', musicId);
        });
    },

    //获取每日推荐的状态数据
    async getRecommendList() {
        let recommendListData = await request('/recommend/songs');
        console.log(recommendListData);
        this.setData({
            recommendList: recommendListData.recommend,
        });
    },

    //跳转至 SongDetail 页面
    toSongDetail(event) {
        let { song, index } = event.currentTarget.dataset;
        //同一个对象中 取两个属性
        //let song = event.currentTarget.dataset.song;
        //let index = event.currentTarget.dataset.index;
        this.setData({
            index,
        });

        //路由跳转时 传参 query参数
        wx.navigateTo({
            //不能直接将 song 对象作为参数传递 长度过长 会被自动截取掉
            //url: '/pages/songDetail/songDetail?song='+JSON.stringify(song),
            url: '/pages/songDetail/songDetail?musicId=' + song.id,
        });
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
