/*
 * @Descripttion: 
 * @version: 
 * @Author: by_mori
 * @Date: 2021-05-19 19:55:32
 * @LastEditors: by_mori
 * @LastEditTime: 2021-05-20 20:51:59
 */
// pages/login/login.js

/* 登录说明
*
*
*
* */

import request from '../../utils/request'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    phone:'',
    password:''

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },
  
  //表单项内容发生改变的回调
  handleInput(event){
    //console.log(event.detail.value);
    //let type=event.currentTarget.id; //id传值 取值 phone || password
    let type=event.currentTarget.dataset.type;
    this.setData({
      [type]:event.detail.value
    })
  },

  //登录的回调
  async login(){
    //1.收集表达项数据
    let {phone,password}=this.data
    //2.前端验证
    /* 
      手机号验证
        1.内容为空
        2.手机号格式不正确 正则匹配
        3.手机号格式正确，验证通过
    */
   if (!phone) {
     //提示用户输入手机号
     wx.showToast({
       title:'手机号不能为空',
       icon:"error",
       duration:2000
     })
     return
   }
   //定义正则表达式
   let phoneReg=/^(?:(?:\+|00)86)?1(?:(?:3[\d])|(?:4[5-79])|(?:5[0-35-9])|(?:6[5-7])|(?:7[0-8])|(?:8[\d])|(?:9[189]))\d{8}$/
   if (!phoneReg.test(phone)) {
     wx.showToast({
       title:'手机号格式错误',
       icon:"error",
       duration:2000
     })
     return
   }
   if (!password) {
     wx.showToast({
       title:'密码不能为空',
       icon:"error",
       duration:2000
     })
     return
   }
   wx.showToast({
       title:'前端验证通过了',
       duration:2000
     })

  //后端验证
  let result= await request('/login/cellphone',{phone,password,isLogin:true})
  if (result.code===200) {
    wx.showToast({
      title:'登录成功'
    })
    //console.log(result);
    //将用户的信息存储到本地
    wx.setStorageSync('userInfo', JSON.stringify(result.profile))

    //跳转到个人中心 personal 页面
    wx.reLaunch({
      url:'/pages/personal/personal'
    })
  } else if (result.code===400) {
    wx.showToast({
      title:'手机号错误',
      icon:'error'
    })
  } else if (result.code===502) {
    wx.showToast({
      title:'密码错误',
      icon:'error'
    })
  } else{
    wx.showToast({
      title:'登录失败 请重新登录',
      icon:'none'
    })
  }
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