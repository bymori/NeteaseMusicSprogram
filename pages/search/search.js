/*
 * @Descripttion:
 * @version:
 * @Author: by_mori
 * @Date: 2021-05-23 10:58:36
 * @LastEditors: by_mori
 * @LastEditTime: 2021-05-23 21:18:20
 */
// pages/search/search.js
import request from '../../utils/request';
let isSend = false; //函数节流使用
Page({
    /**
     * 页面的初始数据
     */
    data: {
        placeholderContent: '', //placeholder 默认搜索关键词
        hotList: [], //热搜榜数据
        searchContent: '', //用户输入的表单项数据
        searchList: [], //关键词模糊匹配搜索 数据
        historyList: [], //搜索历史记录
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        //初始化数据
        this.getInitData();
        //获取本地历史记录功能
        this.getSearchHistory();
    },

    //获取本地历史记录功能
    getSearchHistory() {
        let historyList = wx.getStorageSync('searchHistory');
        if (historyList) {
            this.setData({
                historyList,
            });
        }
    },

    //初始化数据 placeholder 默认搜索关键词
    async getInitData() {
        let placeholderData = await request('/search/default');
        let hotListData = await request('/search/hot/detail');
        this.setData({
            placeholderContent: placeholderData.data.showKeyword,
            hotList: hotListData.data,
        });
    },

    //表单项 搜索框发生改变时的回调
    handleInputChange(event) {
        //console.log(event);
        //更新 searchContent 的状态数据
        this.setData({
            searchContent: event.detail.value.trim(),
        });
        if (isSend) {
            return;
        }
        isSend = true;
        this.getSearchList();
        //函数节流 防抖 优化性能
        setTimeout(async () => {
            isSend = false;
        }, 500);
    },

    //获取 搜索数据的功能函数
    async getSearchList() {
        if (!this.data.searchContent) {
            this.setData({
                searchList: [],
            });
            return;
        }
        let { searchContent, historyList } = this.data;
        //发请求获取关键字 模糊匹配数据
        let searchListData = await request('/search', {
            keywords: searchContent,
            limit: 10,
        });
        this.setData({
            searchList: searchListData.result.songs,
        });

        //将搜索的关键字 添加到历史记录中

        if (historyList.indexOf(searchContent) !== -1) {
            historyList.splice(historyList.indexOf(searchContent), 1);
        }
        historyList.unshift(searchContent);
        this.setData({
            historyList,
        });
        // 关键词存储至本地 下次开启页面调用显示
        wx.setStorageSync('searchHistory', historyList);
    },

    //清空 搜索内容
    clearSearchContent() {
        this.setData({
            searchContent: '',
            searchList: [],
        });
    },

    // 删除搜索历史记录
    deleteSearchHistory(){
        wx.showModal({
            content:'确认清空全部历史记录？',
            success:(res)=>{
                console.log(res.confirm);
                //清空 data中的 historyList
                this.setData({
                    historyList: [],
                });
                //移除本地的历史记录缓存
                wx.removeStorageSync('searchHistory');
            }
        })
        
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
