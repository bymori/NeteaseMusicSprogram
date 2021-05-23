/*
 * @Descripttion:
 * @version:
 * @Author: by_mori
 * @Date: 2021-05-23 21:38:50
 * @LastEditors: by_mori
 * @LastEditTime: 2021-05-23 22:34:37
 */
// pages/other/other.js
import request from '../../utils/request'
Page({
    /**
     * 页面的初始数据
     */
    data: {
        person: {
            userName: 'ioinn',
            age: 99,
        },
    },

    //获取用户唯一标识 openId
    handleGetOpenId() {
        //1.获取登录凭证
        wx.login({
            success: async function (res) {
                let code = res.code;
                //2.将登录凭证发送服务器
                let result=await request('/getOpenId',{code})
                console.log(result);
            },
        });
        
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {},

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
