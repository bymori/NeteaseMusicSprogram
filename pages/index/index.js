/*
 * @Descripttion: 
 * @version: 
 * @Author: by_mori
 * @Date: 2021-05-18 20:08:46
 * @LastEditors: by_mori
 * @LastEditTime: 2021-05-25 12:42:56
 */
// pages/index/index.js
import request from '../../utils/request'
Page({
    /**
     * 页面的初始数据
     */
    data: {
        bannerList: [], //轮播图数据
        recommendList: [], //推荐歌单
        topList: [], //排行榜数据
        topListId: [], //排行榜id
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: async function (options) {
        let bannerListData = await request('/banner', { type: 2 });
        //console.log('结果数据：', bannerListData);
        this.setData({
            bannerList: bannerListData.banners,
        });

        //推荐歌单
        let recommendListData = await request('/personalized', { limit: 10 });
        //console.log('结果数据：', recommendListData);
        this.setData({
            recommendList: recommendListData.result,
        });

        /*  获取排行榜数据
         *需求分析：
         *  1. 需要根据idx的值获取相应的数据
         *  2. idx的取值范固是0-20,我们需要0-4
         *  3. 需要发送5次请求
         *
         *
         * */
        
        //排行榜数据id
        let topListidData = await request('/toplist');
        this.setData({
            topListId: topListidData.list.slice(0, 5),
        });

        let index = 0;
        let resultArr = [];
        while (index < 5) {
        let topListData = await request('/playlist/detail', {
            id: topListidData.list[index++].id,
        });
        let topListItem = {
            name: topListData.playlist.name,
            tarcks: topListData.playlist.tracks.slice(0, 3),
        };
        resultArr.push(topListItem);
        
        this.setData({
            topList: resultArr,
        });
        }
        // 更新topList的状态值
        //放在此处更新会导致发送请求的过程中页面长时间白屏，用户体验差
        /*  this.setData ({
     topList:resultArr
   })

        /* wx.request({
      url:'http://localhost:3000/banner',
      data:{type:2}, //type:资源类型 默认为 0 即 PC 
      // 0 PC  1 android  2 iphone  3 ipad
      //调用例子 : /banner || /banner?type=2
      success: (res) => {
        console.log("请求成功：",res);
      },
      fail: (err) => {
        console.log("请求失败：",err);
      }
    }) */
    },

    //跳转至 RecommendSong 页面的回调
    toRecommendSong() {
        wx.navigateTo({
            url: '/pages/RecommendedSong/RecommendedSong',
        });
    },
    //跳转至 other页面
    toOther() {
        wx.navigateTo({
            url: '/pages/other/other',
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