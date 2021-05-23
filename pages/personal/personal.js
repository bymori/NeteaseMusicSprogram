/*
 * @Descripttion: 
 * @version: 
 * @Author: by_mori
 * @Date: 2021-05-19 18:12:47
 * @LastEditors: by_mori
 * @LastEditTime: 2021-05-19 23:08:27
 */
// pages/personal/personal.js

const { default: request } = require("../../utils/request");

let startY=0; //  手指起始的坐标
let moveY=0; //  手指移动的坐标
let moveDistance=0; //  手指移动的距离
Page({

  /**
   * 页面的初始数据
   */
  data: {
    coverTransform:'translateY(0)',
    coveTransition:'',
    userInfo:'', //用户信息
    recentPlayList:[],//用户播放记录
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //读取用户的基本信息
    let userInfo=wx.getStorageSync('userInfo')
    console.log(userInfo);
    if (userInfo) {
      //更新userInfo的状态
      this.setData({
        userInfo:JSON.parse(userInfo)
      })
      //获取用户播放记录
      this.getUserRecentPlayList(this.data.userInfo.userId)
    }
  },

  //获取用户播放记录的函数功能
   async getUserRecentPlayList(userId){
    let recentPlayListData= await request('/user/record',{uid:userId,type:0})
    let index=0
    let recentPlayList=recentPlayListData.allData.splice(0,10).map(item=>{
      item.id=index++
      return item
    })
    this.setData({
      recentPlayList
    })
  }, 

  handleTouchStart(event){
    this.setData({
      coveTransition:''
    })
    //获取手指起始坐标
    startY=event.touches[0].clientY
  },
  handleTouchMove(event){
    moveY=event.touches[0].clientY;
    moveDistance=moveY-startY
    if(moveDistance<=0){
      return
    }
    if(moveDistance>=80){
      moveDistance=80
    }
    this.setData({
      coverTransform:`translateY(${moveDistance}rpx)`
    })
  },
  handleTouchEnd(){
    //动态更新 coverTransform 的状态值
     this.setData({
      coverTransform:`translateY(0rpx)`,
      coveTransition:'transform 1s linear'
    })
  },

  //跳转至login页面的回调
  toLogin(){
    wx.navigateTo({
      url:'/pages/login/login'
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

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})