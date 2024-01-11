import moment from "moment";
import RNFetchBlob from 'react-native-fetch-blob';
import RNFetchBlobFile from "react-native-fetch-blob/class/RNFetchBlobFile";
import privilegeHelper from "../utils/privilegeHelper";
import { localStr } from "../utils/Localizations/localization";
import { DeviceEventEmitter } from "react-native";
import {getLanguage} from "../../../../app/utils/Localizations/localization";
let _BASEURL = '';

export function getBaseUri() {
  return _BASEURL;
}

export function getCookie() {
  return setCookie;
}

function configLan(){
  let lan = getLanguage()
  if(lan === 'en') {
    return `en-US`
  }
  return `zh-CN`
}

let defaultFetch = async function (options) {

  let baseUrl = getBaseUri();
  let headers = {
    "Content-Type": "application/json",
    'Accept': 'application/json',
    'Cache-Control': 'no-store',
    'Accept-Language':configLan(),
  };
  //headers[tokenKey] = token;
  //headers['Cookie'] = token;
  if (setCookie) {
    headers['cookie'] = setCookie;
  }
  let url = null;
  if (options.url.includes('/bff/')) {
    url = baseUrl + options.url
  } else {
    url = `${baseUrl}/bff/eh/rest/${options.url}`
  }
  if (options.url.includes('http')) url = options.url;
  let body = null;
  if (options.contenttype) {
    headers['Content-Type'] = options.contenttype;
    body = 'SAMLResponse=' + encodeURIComponent(options.body.SAMLResponse);
  } else {
    if (Array.isArray(options.body)) {
      body = options.body
    } else {
      body = {
        ...options.body,
        sysId, userId,
        customerId
      }
    }

    body = JSON.stringify(body);
  }
  if (options.verb === 'get') {
    body = null;
  }
  return fetch(url, {
    method: options.verb,
    headers,
    body: body,
  }).then((response) => {
    // console.log('<<<<response', body, response.status, response, url)
    if (response.status === 204) {
      return new Promise((resolve) => {
        resolve({ code: response.status, msg: localStr('lang_server_error') });
      })
    } else if (response.status === 401) {
      return new Promise((resolve) => {
        resolve({ code: response.status, msg: localStr('lang_http_401') });
      })
    } else if (response.status === 403) {
      return new Promise((resolve) => {
        resolve({ code: response.status, msg: localStr('lang_server_error') });
      })
    } else if (response.status === 404) {
      return new Promise((resolve) => {
        resolve({ code: response.status, msg: localStr('lang_server_error') });
      })
    } else if (response.status >= 500) {
      return new Promise((resolve) => {
        resolve({ code: response.status, msg: localStr('lang_server_error') });
      })
    }

    if (options.url === 'getCookie') {
      //设置cookie
      setCookie = response.headers.map['set-cookie'];
      setCookie = setCookie.split(';')[0]
      setCookie = setCookie + ','//+setCookie;
      //初始化成功了，发个通知
      DeviceEventEmitter.emit('TICKET_INVENTORY_INIT_OK');
    }

    if (options.url === 'document/get' || options.debug) {
      let reader = new FileReader();
      //console.log('ddd',response.data())
      return response.blob()//reader.result;
    }
    return response.json()
  })
    .then((data) => {
      if (options.url === '/bff/eh/rest/common/oss/path') {
        //这里设置oss path
        if (data.code === '0' && data.data) {
          ossPath = data.data;
        }
      } else {
        //这里判断是否设置过oss path,没有就调用接口设置，防止初始化oss接口失败，一直不显示的问题
        if (!ossPath) apiGetOssPath();
      }
      // if(options.url === 'document/get' || options.debug) {
      //   let reader =  new FileReader();
      //   reader.onloadend = function (e) {
      //     console.log('e',e);
      //   }
      //   reader.readAsDataURL(data);
      //   // reader.readAsText(data,'base64')
      //
      //   console.log('data',data)
      //   return data//reader.result;
      // }
      console.log('\n请求参数:' + body + '\n请求地址:' + url + '\n请求结果:' + data + '\n\n' + JSON.stringify(data) + '\n\n',data);

      return data;
    }).catch(err => {
      return new Promise((resolve) => {
        resolve({ code: -1, msg: localStr('lang_network_error') });
      })
    });
}
export let setCookie = null;
let sysId = 0;
export let prod = null;
export let userId = 90;
export let userName = '1';
export let customerId = null;
export let ossPath = '';
export let spId = 70;
let token = '';
let tokenKey = '';
let hierarchyId = 0;

export function config(data) {
  // sysId = data.sysId;
  // userId = data.userId;
  // token = data.token;
  // tokenKey = data.tokenKey;
}


//请求工单列表
export async function apiTicketList(date, pageNo) {
  return await defaultFetch({
    url: 'ticket/ticketList',
    verb: 'post',
    body: {
      searchDate: date,
      // pageNo,
      ticketTypes: [11, 12]
    }
  })
}

//工单筛选
export function filterTicketList() {

}

const DAY_FORMAT = 'YYYY-MM-DD';

export async function apiTicketCount(start, end) {
  //这里对日期做一道格式化
  start = moment(start).format(DAY_FORMAT);
  end = moment(end).format(DAY_FORMAT)
  return await defaultFetch({
    url: 'ticket/ticketCount',
    verb: 'post',
    body: {
      startDate: start,
      endDate: end,
      ticketTypes: [11, 12]
      // locations:[
      //   {
      //     locationId:hierarchyId,
      //     locationType:100
      //   }
      // ]
    }
  })
}

export async function apiQueryTicketList(filter) {
  //这里对filter做一次处理
  let data = {
    ticketTypes: [11, 12]
  }
  if (filter.selectStatus && filter.selectStatus.length > 0) {
    data.ticketState = filter.selectStatus.map(item => {
      switch (item) {
        case 0: return 10
        case 1: return 20
        case 2: return 30
        case 3: return 40
        case 4: return 50
        case 5: return 60
      }
    })
  }
  if (filter.StartTime) {
    data.startDate = moment(filter.StartTime).format(DAY_FORMAT);
  }
  if (filter.EndTime) {
    data.endDate = moment(filter.EndTime).format(DAY_FORMAT);
  }
  if (filter.ticketName) data.title = filter.ticketName;
  // data.locations=[
  //   {
  //     locationId:hierarchyId,
  //     locationType:100
  //   }
  // ]

  return await defaultFetch({
    url: 'ticket/daysTicketList',
    verb: 'post',
    body: data
  })
}

export function updateInventoryCustomerId(id){
  customerId = id;
}

export async function configCookie(data) {
  sysId = data.sysId;
  userId = data.userId;
  customerId = data.customerId;
  spId = data.SpId;
  userName = data.userName
  token = data.token;
  setCookie = data.token;
  _BASEURL = data.host;
  // tokenKey = data.tokenKey;
  hierarchyId = data.hierarchyId;
  prod = data.prod;
  privilegeHelper.setPrivilegeCodes(data.privileges);
  let body = {
    ...data,
    userId, userName, sysId
  }
  body.prod = null;
  // return await defaultFetch({
  //   url:'getCookie',
  //   verb:'post',
  //   body:body
  // })
  //这里调用oss获取
  apiGetOssPath();
}
//获取工单详情
export async function apiTicketDetail(tid) {
  return await defaultFetch({
    url: `ticket/detail`,
    verb: 'post',
    body: {
      id: tid
    }
  })
}

//获取盘点工单待盘点设备
export async function apiTicketLostDevices(data) {
  return await defaultFetch({
    url: `/bff/eh/rest/getMaybeLostDeviceDetailsByShop`,
    verb: 'post',
    body: data
  })
}

//获取盘点工单待盘点设备状态
export async function apiTicketDeviceStatus(data) {
  return await defaultFetch({
    url: `/bff/eh/rest/getDevicesStatusByIds`,
    verb: 'post',
    body: data
  })
}

//获取台账模板
export async function apiTplTree(spid) {
  return await defaultFetch({
    url: `/bff/xiot/rest/getTemplateParametertree`,
    verb: 'post',
    body: {
      spId: spid
    }
  })
}

//获取层级台账模板
export async function apiHierarchyTpl() {
  return await defaultFetch({
    url: `/bff/xiot/rest/getHierarchyTemplate`,
    verb: 'post',
    body: {
      id: '1',
      type: 'fmhc'
    }
  })
}

//获取层级台账模板
export async function apiAddDeviceInitData(data, isEdit) {
  return await defaultFetch({
    url: isEdit ? `/bff/eh/rest/ticket/editDeviceInitData`
      : `/bff/eh/rest/ticket/addDeviceInitData`,
    verb: 'post',
    body: data
  })
}


//设置盘点工单待盘点设备状态
export async function apiCheckDeviceStatus(data) {
  return await defaultFetch({
    url: `/bff/eh/rest/setDevicesStatus`,
    verb: 'post',
    body: data
  })
}

//获取盘点结果页，盘点工单中设备状态
export async function apiLoadDevicePointCheckStatus(data) {
  return await defaultFetch({
    url: `/bff/eh/rest/hierarchyInstantiation/getAssetStatus`,
    verb: 'post',
    body: data
  })
}

//更新盘点设备状态
export async function apiUpdateDevicePointCheckStatus(data) {
  return await defaultFetch({
    url: `/bff/eh/rest/hierarchyInstantiation/updateAssetStatus`,
    verb: 'post',
    body: data
  })
}

export async function apiRemoveTicketInitAsset(data) {
  return await defaultFetch({
    url: `/bff/eh/rest/ticket/removeDeviceInitData`,
    verb: 'post',
    body: data
  })
}

export async function apiGetOssPath() {
  return await defaultFetch({
    url: `/bff/eh/rest/common/oss/path`,
    verb: 'post',
    body: {}
  })
}

export async function apiSubmitPointCheckResult(data) {
  return await defaultFetch({
    url: `/bff/eh/rest/ticket/changePointCheckState`,
    verb: 'post',
    body: data
  })
}

export async function apiTicketExecute(tid) {
  return await defaultFetch({
    url: `ticket/start`,
    verb: 'post',
    body: {
      id: tid,
      userId, userName
    }
  })
}

export async function apiCreateLog(data, isCreate) {
  return await defaultFetch({
    url: isCreate ? 'ticket/addLog' : 'ticket/editLog',
    verb: 'post',
    body: data
  })
}


export async function apiUploadFile(data) {
  return await defaultFetch({
    url: 'document/upload',
    verb: 'post',
    body: data
  })
}

///455575034025738240
export async function apiDownloadFile(key) {
  return await defaultFetch({
    url: `document/get`,//'https://img.zmtc.com/2020/1204/20201204084219498.jpg',//`document/get`,
    verb: 'post',
    debug: true,
    body: {
      key
    }
  })
}

export async function apiGetTicketExecutors(assets) {
  let arr = assets.map(item => {
    return {
      locationId: item.locationId,
      locationType: item.locationType
    }
  })
  arr = assets;
  return await defaultFetch({
    url: `ticket/edit/executors`,
    verb: 'post',
    body: arr
  })
}

export async function apiGetExecutorData(users) {
  return await defaultFetch({
    url: `ticket/executorDetailList`,
    verb: 'post',
    body: {
      userIds: users
    }
  })
}

export async function apiDelTicketLog(data) {
  return await defaultFetch({
    url: `ticket/removeLog`,
    verb: 'post',
    body: data
  })
}

export async function apiEditTicket(data) {
  return await defaultFetch({
    url: `ticket/update`,
    verb: 'post',
    body: data
  })
}

export async function apiCreateTicket(data) {
  return await defaultFetch({
    url: `ticket/create`,
    verb: 'post',
    body: data
  })
}

export async function apiIgnoreTicket(data) {
  return await defaultFetch({
    url: `ticket/ignore`,
    verb: 'post',
    body: data
  })
}

export async function apiSubmitTicket(data) {
  return await defaultFetch({
    url: `ticket/submit`,
    verb: 'post',
    body: data
  })
}

export async function apiRejectTicket(data) {
  return await defaultFetch({
    url: `ticket/reject`,
    verb: 'post',
    body: data
  })
}

export async function apiCloseTicket(data) {
  return await defaultFetch({
    url: `ticket/accept`,
    verb: 'post',
    body: data
  })
}

export async function apiCreateScrapTicket(data) {
  return await defaultFetch({
    url: `scrapTicket/create`,
    verb: 'post',
    body: data
  })
}


export async function apiCreateNewAsset(data) {
  return await defaultFetch({
    url: `/bff/eh/rest/common/createDevice`,
    verb: 'post',
    body: data
  })
}

export async function apiUpdateAssetId(data) {
  return await defaultFetch({
    url: `/bff/eh/rest/ticket/updateAssetId`,
    verb: 'post',
    body: data
  })
}

export async function apiHierarchyList(data) {
  return await defaultFetch({
    url: '/bff/eh/rest/common/hierarchyList',
    verb: 'post',
    body: data
  })
}

/**
 * 工单列表
 * @param data
 * @returns {Promise<unknown>}
 */
export async function apiAppTicketList(data){
  return await defaultFetch({
    url: '/bff/eh/rest/ticket/appTicketList',
    verb: 'post',
    body: data
  })
}
