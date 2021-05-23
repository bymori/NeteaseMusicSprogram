/*
 * @Descripttion: 
 * @version: 
 * @Author: by_mori
 * @Date: 2021-05-18 23:31:29
 * @LastEditors: by_mori
 * @LastEditTime: 2021-05-22 20:22:03
 */
//发送 ajax请求
/*
1.封装功能函数
    1.功能点明确
    2.函数内部应该保留固定代码（静态的）
    3.将动态的数据抽取成形参，由使用者根据自身的情況动态的传入实参
    4.一个良好的功能函数应该设置形参的默认值(ES6的形参默认值)
2.封装功能组件
    1.功能点明确
    2.组件内部保留静态的代码
    3.将动态的数指抽取成 porps参数，由使用据自身的情況以标签属性的形式动态传入 porps数据
    4.一个良好的组件应该设置组件的必要性及数据类型
        props:{
            msg:{
                required:true,
                default:默认值,
                type:String
            }
        }
*/

import config from "./config"
export default (url,data={},method='GET')=>{
    return new Promise((resolve,reject)=>{
        //1.new Promise 初始化 promise 实例的状态为pending
        wx.request({
            url:config.host+url,
            data,
            method,
            header:{
                //cookie:wx.getStorageSync('cookies')[2] //登录返回数组顺序不一
                cookie:wx.getStorageSync('cookies')?wx.getStorageSync('cookies').find(item=>item.indexOf('MUSIC_U')!==-1):'' //返回指定的值 的下标
            },
            success: (res) => {
              //console.log("请求成功：",res);
              //console.log(res); //登录返回全部数据
              if (data.isLogin) {
                  wx.setStorage({ //登录请求
                      key: 'cookies',
                      data: res.cookies
                  })
              }
              resolve(res.data) //resolve 修改promise的状态为成功状态resolve
            },
            fail: (err) => {
              //console.log("请求失败：",err);
              reject(err) //reject 修改promise的状态为失败状态reject
             }
        })
    })
}