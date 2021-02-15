const $ = new Env('积分加油站');

//京喜签到需要token
//token直接whyour 大佬的京喜农场的token即可，将whyour 大佬的token中的farm_jstoken换成ss_jstoken
//token填入示例：
//{"ss_jstoken":"4782bbf5ab4cdb9a0b17d798ae021114","timestamp":"1610782844359","phoneid":"3524914bc77506b1-35666505646247"}
const token=[
  {"ss_jstoken":"2d4766e22b35fde425fab217c13cb47a","timestamp":"1613145701637","phoneid":"e1fd25eb2b777177e8aced6a259f01b2174f2d95"},//账号一
];


const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let jdNotify = true;//是否关闭通知，false打开通知推送，true关闭通知推送
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '', message;
//可自定义user-agent
const useragent=`jdapp;android;9.3.5;10;3353234393134326-3673735303632613;network/wifi;model/MI 8;addressid/138719729;aid/3524914bc77506b1;oaid/274aeb3d01b03a22;osVer/29;appBuild/86390;psn/60Z32JCkt/YChVlXvOXZiTUoE59ipO/s|1883;psq/2;adk/;ads/;pap/JA2015_311210|9.3.5|ANDROID 10;osv/10;pv/1728.7;jdv/0|kong|t_1000170135|tuiguang|notset|1610278553947|1610278553;ref/com.jd.lib.personal.view.fragment.JDPersonalFragment;partner/jingdong;apprpd/MyJD_Main;eufv/1;jdSupportDarkMode/0;Mozilla/5.0 (Linux; Android 10; MI 8 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045230 Mobile Safari/537.36`;

if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  let cookiesData = $.getdata('CookiesJD') || "[]";
  cookiesData = jsonParse(cookiesData);
  cookiesArr = cookiesData.map(item => item.cookie);
  cookiesArr.reverse();
  cookiesArr.push(...[$.getdata('CookieJD2'), $.getdata('CookieJD')]);
  cookiesArr.reverse();
  cookiesArr = cookiesArr.filter(item => item !== "" && item !== null && item !== undefined);
}
const JD_API_HOST = 'https://api.m.jd.com/client.action';
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1])
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      message = '';
      console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue
      }
      await jdSign(i)
    }
  }
})()
    .catch((e) => {
      $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
    })
    .finally(() => {
      $.done();
    })
async function jdSign(i) {
  await sign()
  await gwprocess()
  if (i<token.length) {
    await qrjingxiQuerystatus(i)
  	await jingxiQuerystatus(i)
    await jingxi(i) //京喜签到需要token
  }else{
    console.log(`京喜：请提供token`)
  }
  await user()
}

function sign() {
  return new Promise((resolve) => {
    $.get(taskUrl(), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if( data.code === 200 ){
              console.log(`签到成功：获得${data.data.signInfo.signNum}`)
            }else if (302==data.code ){
              console.log(`已签到，请勿重复签到！！！`)
            }else{
              console.log(`签到失败，${data.msg}`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

function gwprocess() {
  return new Promise((resolve) => {
    $.post(processUrl(), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if( data.resultData.data.businessMsg === '成功' ){
              console.log(`金融双签成功：获得${data.resultData.data.businessData.awardListVo[0].count}`)
            }else{
              console.log(`签到失败，${data.resultData.data.businessMsg}`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

function qrjingxiQuerystatus(i) {
  return new Promise((resolve) => {
    $.get(jingxiUrl(i,`querystatus?ch=7`,new Date().getTime()), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          // data = JSON.parse(data);
          // console.log(`status：`+data);
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}
function jingxiQuerystatus(i) {
  return new Promise((resolve) => {
    $.get(jingxiUrl(i,`querystatus?ch=7`,token[i].timestamp), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          // data = JSON.parse(data);
          // console.log(`status：`+data);
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

function qrjingxi(i) {
  return new Promise((resolve) => {
    $.get(jingxiUrl(i,`getreward?ch=7&jf=1&hb=0`,new Date().getTime()), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          // data = JSON.parse(data);
          // console.log(`京喜签到：`+data);
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}
function jingxi(i) {
  return new Promise((resolve) => {
    $.get(jingxiUrl(i,`getreward?ch=7&jf=1&hb=0`,token[i].timestamp), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          // data = JSON.parse(data);
          console.log(`京喜签到：`+data);
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}
function user() {
  return new Promise((resolve) => {
    $.get(userUrl(), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            console.log(`积分总额：${data.data.totalNum}`);
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

function showMsg() {
  return new Promise(resolve => {
    if (!jdNotify) {
      $.msg($.name, '', `${message}`);
    } else {
      $.log(`京东账号${$.index}${$.nickName}\n${message}`);
    }
    resolve()
  })
}


function taskUrl() {
  return {
    url: `https://dwapp.jd.com/user/sign?t=8363`,
    headers: {
      'referer': 'https://prodev.m.jd.com/mall/active/eEcYM32eezJB7YX4SBihziJCiGV/index.html?tttparams=cD7W9nbeyJnTGF0IjoiMzAuMzMyNSIsImdMbmciOiIxMTIuMjE1NTUzIn70%3D&lng=113.716206&lat=31.315008&sid=5b70b246b7dcf77b7b7cec21cb97c82w&un_area=17_1413_4078_52280',
      'user-agent': useragent,
      'accept-language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      'accept-encoding': 'gzip, deflate, br',
      'origin': 'https://prodev.m.jd.com',
      'cookie': cookie,
    }
  }
}

function processUrl() {
  return {
    url: `https://nu.jr.jd.com/gw/generic/jrm/h5/m/process`,
    body: `reqData=%7B%22actCode%22%3A%221DF13833F7%22%2C%22type%22%3A3%2C%22frontParam%22%3A%7B%22belong%22%3A3%2C%22channel%22%3A%22JR%22%7D%7D`,
    headers: {
      'Host':'nu.jr.jd.com',
      'Connection':'keep-alive',
      'Content-Length':'134',
      'Accept': 'application/json',
      'Origin': 'https://active.jd.com',
      'User-Agent':`Mozilla/5.0 (Linux; Android 10; MI 8 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/87.0.4280.141 Mobile Safari/537.36/application=JDJR-App&clientType=android&deviceId=a18e9b16b576c7fa&token_eid=jdd01LAI223M4OZNMPX2PUQHRYK7PLOSX7ET5JK4QMARTWQRDABOBKROPWRY4MDWLJ3S2H5OFYQGVZFFOFGXHPORNFJFQQY6KJJWRV4TEZUQ01234567&andr_id=a18e9b16b576c7fa&oa_id=274aeb3d01b03a22&src=oppo&version=6.0.54&clientVersion=6.0.54&osVersion=10&osName=MI 8&isUpdate=0&HiClVersion=&netWork=1&netWorkType=1&CpayJS=UnionPay/1.0 JDJR&sPoint=MTAwMDYjIw%3D%3D%0A&*#@jdPaySDK*#@jdPayChannel=jdFinance&jdPayChannelVersion=6.0.54&jdPaySdkVersion=1.1.3&androidBrand=Xiaomi&androidManufacturer=Xiaomi&jdPayClientName=Android*#@jdPaySDK*#@`,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Referer': 'https://active.jd.com/',
      'Accept-Encoding': 'gzip, deflate',
      'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cookie': cookie,
    }
  }
}

function jingxiUrl(i,functionid,times) {
  return {
    url: `https://m.jingxi.com/cubeactive/scorestation/${functionid}&ss_jstoken=${token[i].ss_jstoken}&timestamp=${times}&phoneid=${token[i].phoneid}&_=${new Date().getTime()}&sceneval=2&g_login_type=1&callback=dsl&g_ty=ls`,
    headers: {
      'accept': '*/*',
      'user-agent': `jdpingou;android;4.0.2;10;3524914bc77506b1-35666505646247;network/wifi;model/MI 8;appBuild/14894;partner/jingdong;;session/178;aid/3524914bc77506b1;oaid/274aeb3d01b03a22;pap/JA2019_3111789;brand/Xiaomi;Mozilla/5.0 (Linux; Android 10; MI 8 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/87.0.4280.141 Mobile Safari/537.36`,
      'referer': 'https://st.jingxi.com/',
      'accept-encoding': 'gzip, deflate',
      'x-requested-with': 'com.jd.pingou',
      'sec-fetch-site': 'same-site',
      'sec-fetch-mode': 'no-cors',
      'sec-fetch-dest': 'script',
      'accept-language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      'cookie': cookie
    }
  }
}

function userUrl() {
  return {
    url: `https://dwapp.jd.com/user/signInfo?t=3242`,
    headers: {
      'accept': '*/*',
      'origin': 'https://prodev.m.jd.com',
      'user-agent': useragent,
      'referer': 'https://prodev.m.jd.com/mall/active/eEcYM32eezJB7YX4SBihziJCiGV/index.html?tttparams=7u393NRFFeyJnTGF0IjoiMzAuMzMyNSIsImdMbmciOiIxMTIuMjE1NTUzIn90%3D&lng=113.716206&lat=31.315008&sid=5b70b246b7dcf77b7b7cec21cb97c82w&un_area=17_1413_4078_52280',
      'accept-encoding': 'gzip, deflate, br',
      'accept-language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      'cookie': cookie,
    }
  }
}

function safeGet(data) {
  try {
    if (typeof JSON.parse(data) == "object") {
      return true;
    }
  } catch (e) {
    console.log(e);
    console.log(`京东服务器访问数据为空，请检查自身设备网络情况`);
    return false;
  }
}
function jsonParse(str) {
  if (typeof str == "string") {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.log(e);
      $.msg($.name, '', '请勿随意在BoxJs输入框修改内容\n建议通过脚本去获取cookie')
      return [];
    }
  }
}
// prettier-ignore
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`\ud83d\udd14${this.name}, \u5f00\u59cb!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),a={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(a,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t){let e={"M+":(new Date).getMonth()+1,"d+":(new Date).getDate(),"H+":(new Date).getHours(),"m+":(new Date).getMinutes(),"s+":(new Date).getSeconds(),"q+":Math.floor(((new Date).getMonth()+3)/3),S:(new Date).getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,((new Date).getFullYear()+"").substr(4-RegExp.$1.length)));for(let s in e)new RegExp("("+s+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?e[s]:("00"+e[s]).substr((""+e[s]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r)));let h=["","==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="];h.push(e),s&&h.push(s),i&&h.push(i),console.log(h.join("\n")),this.logs=this.logs.concat(h)}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t.stack):this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}
