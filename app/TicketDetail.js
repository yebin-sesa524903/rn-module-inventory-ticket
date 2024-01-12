
'use strict';
import React, { Component } from 'react';

import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  DeviceEventEmitter,
  Text, Dimensions, Alert, TouchableOpacity, TouchableWithoutFeedback, Modal, Image, InteractionManager, Appearance
} from 'react-native';

import Toolbar from './components/Toolbar';
// import Share from "react-native-share";
import { GRAY, BLACK, TAB, TAB_BORDER, GREEN, TICKET_STATUS, LINE, LIST_BG, ADDICONCOLOR } from './styles/color';
import moment from 'moment';

import Button from './components/Button';

import MoreContent from './components/MoreContent';
import TouchFeedback from './components/TouchFeedback';
import Icon from './components/Icon.js';
import Bottom from './components/Bottom.js';
import Loading from './components/Loading';
import { isPhoneX } from './utils';
import ScanResult from "./ScanResult";

import SchActionSheet from './components/actionsheet/SchActionSheet';
import CommonDialog from './components/actionsheet/CommonActionSheet';
// import AssetsText from '../AssetsText';
// import ViewShot from "react-native-view-shot";
// import CameraRoll from "@react-native-community/cameraroll";

let ViewShot = View;

const CODE_OK = '0';
const STATE_NOT_START = 10
const STATE_STARTING = 20
const STATE_IGNORED = 60
const STATE_PENDING_AUDIT = 30
const STATE_CLOSED = 50
const STATE_REJECTED = 40
const REJECT_OPERATION_TYPE = 34

import {getLanguage, localStr} from "./utils/Localizations/localization";
import NetworkImage from './components/NetworkImage'
import {
  apiCheckDeviceStatus,
  apiCloseTicket,
  apiCreateScrapTicket,
  apiCreateNewAsset,
  apiUpdateAssetId,
  apiCreateTicket,
  apiDelTicketLog,
  apiEditTicket,
  apiGetTicketExecutors, apiIgnoreTicket, apiRejectTicket, apiSubmitTicket,
  apiTicketDetail, apiTicketDeviceStatus, apiRemoveTicketInitAsset,
  apiTicketExecute, apiTicketLostDevices, customerId, getBaseUri,
  userId,
  userName,
  spId,
  apiSubmitPointCheckResult,
  apiUpdateDevicePointCheckStatus,
} from "./middleware/bff";
import ImagePicker from "./components/ImagePicker";
import RNFS, { DocumentDirectoryPath } from 'react-native-fs';
import TicketLogEdit from "./TicketLogEdit";
import CacheImage from "./CacheImage";
import TicketSelectTime from "./TicketSelectTime";
import TicketSelectExecutors from "./TicketSelectExecutors";
import { ImageViewer } from "./ImageViewer";
import PhotoShowView from "./components/assets/PhotoShowView";
import privilegeHelper, { CodeMap } from "./utils/privilegeHelper";
import Scan from "./Scan";
import DeviceAdd from "./DeviceAdd";
import { Toast } from '@ant-design/react-native';
import Colors, {AppearanceMode, isDarkMode} from "../../../app/utils/const/Colors";
import SndAlert from "../../../app/utils/components/SndAlert";
// import Share from "react-native-share";


const DEVICE_STATUS_ICON = {
  0: require('./images/device_status/device_new.png'),
  1: require('./images/device_status/device_new.png'),
  2: require('./images/device_status/device_already_pd.png'),
  3: require('./images/device_status/device_loss.png'),
  4: require('./images/device_status/device_new.png'),
}

const DEVICE_STATUS_ICON2 = ()=>{
  return {
    dark_loss_zh:require('./images/device_status/pk-Dark-cn.png'),
    dark_loss_en:require('./images/device_status/pk-Dark-en.png'),
    light_loss_zh:require('./images/device_status/pk-Light-cn.png'),
    light_loss_en:require('./images/device_status/pk-Light-en.png'),
    dark_gain_zh:require('./images/device_status/py-Dark-cn.png'),
    dark_gain_en:require('./images/device_status/py-Dark-en.png'),
    light_gain_zh:require('./images/device_status/py-Light-cn.png'),
    light_gain_en:require('./images/device_status/py-Light-en.png'),
    dark_checked_zh:require('./images/device_status/yp-Dark-cn.png'),
    dark_checked_en:require('./images/device_status/yp-Dark-en.png'),
    light_checked_zh:require('./images/device_status/yp-Light-cn.png'),
    light_checked_en:require('./images/device_status/yp-Light-en.png'),
  }
}

function getInventoryIcon(status) {
  let lang = getLanguage();
  let theme = Appearance.getColorScheme();
  let light = 'light'
  switch (status) {
    case 2:
      return lang === 'en' ?
          theme === light ? DEVICE_STATUS_ICON2().light_checked_en : DEVICE_STATUS_ICON2().dark_checked_en
          :
          theme === light ? DEVICE_STATUS_ICON2().light_checked_zh : DEVICE_STATUS_ICON2().dark_checked_zh
    case 3:
      return lang === 'en' ?
          theme === light ? DEVICE_STATUS_ICON2().light_loss_en : DEVICE_STATUS_ICON2().dark_loss_en
          :
          theme === light ? DEVICE_STATUS_ICON2().light_loss_zh : DEVICE_STATUS_ICON2().dark_loss_zh
    case 4:
      return lang === 'en' ?
          theme === light ? DEVICE_STATUS_ICON2().light_gain_en : DEVICE_STATUS_ICON2().dark_gain_en
          :
          theme === light ? DEVICE_STATUS_ICON2().light_gain_zh : DEVICE_STATUS_ICON2().dark_gain_zh

  }
}

class Avatar extends Component {

  _renderImage(radius) {
    return (
      <View style={{ borderWidth: 1, borderColor: '#e6e6e6', borderRadius: radius + 1 }}>
        <NetworkImage
          style={{ borderRadius: radius, ...this.props.style }}
          resizeMode="cover"
          imgType='jpg'
          defaultSource={require('./images/building_default/building.png')}
          width={radius * 2 - 1} height={radius * 2 - 1}
          name={this.props.imgKey} />
      </View>
    );
  }

  render() {
    let radius = this.props.radius || 15;
    if (this.props.imgKey) return this._renderImage(radius);
    let letter = this.props.name || '';
    if (letter.length > 0) letter = letter[0];
    return (
      <View style={{
        width: radius * 2, height: radius * 2, borderRadius: radius, backgroundColor: '#f2f2f2',
        alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e6e6e6',
        ...this.props.style
      }}>
        <Text style={{ fontSize: radius, color: '#888' }}>{letter}</Text>
      </View>
    )
  }
}

export default class TicketDetail extends Component {
  constructor(props) {
    super(props);
    let { width } = Dimensions.get('window');
    this.picWid = parseInt((width - 46 - 40) / 4.0);
    this.state = { toolbarOpacity: 0, showToolbar: false, forceStoped: false, deviceList: null, deviceTab: props.deviceTab };
  }

  _renderInventoryTicketInfo() {
    return (
      <View style={{ margin: 16, padding: 16, backgroundColor: Colors.seBgContainer, borderRadius: 12 }}>
        <Text style={{ fontSize: 16, color: Colors.seTextTitle, fontWeight: 'bold' }}>{this.state.rowData.title}</Text>
        <Text style={{ fontSize: 12, color: Colors.seTextSecondary, marginVertical: 8 }}>
          {`${localStr('lang_ticket_detail_execute_time')}：${moment(this.state.rowData.startTime).format('YYYY-MM-DD')} ~ ${moment(this.state.rowData.endTime).format('YYYY-MM-DD')}`}
        </Text>
        <Text style={{ fontSize: 12, lineHeight: 20, color: Colors.seTextSecondary, }}>{`${localStr('lang_ticket_detail_execute_person')}：${this.state.rowData.executors.map(item => item.userName).join('、')}`}</Text>
      </View>
    )
  }

  _getAssetView() {
    let rowData = this.state.rowData;
    var type = rowData.ticketTypeLabel;//localStr('lang_ticket_diagnose')//rowData.get('TicketType');

    var startTime = moment(rowData.startTime).format('MM-DD'),
      endTime = moment(rowData.endTime).format('MM-DD');

    let assetNames = rowData.assets || [];
    assetNames = assetNames.map(item => item.assetName).join(',')

    let locationNames = rowData.assets.map(item => item.locationName).join(',')

    let executor = null;
    if (rowData.executors && rowData.executors.length > 0) {
      let names = rowData.executors.map(item => {
        return item.userName;
      });
      executor = (
        <View style={{ flex: 1, flexDirection: 'row', marginLeft: 0, marginTop: 8 }}>
          <View style={{ marginTop: 3, }}>
            <Icon type={'icon_person'} size={13} color={'#999'} />
          </View>
          <View style={{ flex: 1, marginLeft: 4, }}>
            <Text numberOfLines={10} style={[{ fontSize: 13, color: '#999', lineHeight: 20, }]}>
              {names.join('、')}
            </Text>
          </View>
        </View>
      );
    }
    return (
      <View style={{ paddingBottom: 14, backgroundColor: 'white' }}>
        <View style={{
          paddingTop: 15, paddingBottom: 12, paddingLeft: 16,
          flexDirection: 'row', alignItems: 'center', paddingRight: 16,
        }}>
          <Text numberOfLines={1} style={{ fontSize: 17, color: '#333', fontWeight: 'bold', flexShrink: 1 }}>{rowData.title}</Text>
          <View style={{
            borderRadius: 10, paddingVertical: 2, paddingHorizontal: 8,
            borderColor: '#219bfd', borderWidth: 1, marginLeft: 8,
          }}>
            <Text style={{ fontSize: 11, color: '#219bfd' }}>{type}</Text>
          </View>
        </View>
        <View style={styles.moreContent}>
          <Text style={{ fontSize: 15, color: '#333' }}>{localStr('lang_ticket_detail_assets') + ':' + assetNames}</Text>
        </View>

        <View style={{ paddingHorizontal: 16, backgroundColor: '' }}>
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <View style={{ minWidth: 115, flexDirection: 'row' }}>
              <Icon type={'icon_date'} size={13} color={'#999'} />
              <View style={{ flex: 1, marginLeft: 4, }}>
                <Text numberOfLines={1} style={[{ fontSize: 13, color: '#999' }]}>{`${startTime} ${localStr('lang_ticket_to')} ${endTime}`}</Text>
              </View>
            </View>
            <View style={{ flex: 1, flexDirection: 'row', marginLeft: 21, }}>
              <Icon style={{ marginTop: 2 }} type={'arrow_location'} size={11} color={'#999'} />
              <View style={{ flex: 1, marginLeft: 4, }}>
                <Text numberOfLines={1} style={[{ color: '#999', fontSize: 13 }]}>{locationNames}</Text>
              </View>
            </View>
          </View>
          {executor}
        </View>
      </View>
    );
  }
  _getTaskView() {
    let rowData = this.state.rowData;
    var content = rowData.content;
    if (content) {
      content = content.replace(/(^\s*)|(\s*$)/g, "");
    }
    return (
      <View style={{ paddingBottom: 0, backgroundColor: 'white' }}>
        <View style={{
          paddingTop: 16, paddingBottom: 12, paddingLeft: 16,
          flexDirection: 'row', alignItems: 'center'
        }}>
          <Text style={{ fontSize: 17, color: 'black', fontWeight: 'bold' }}>{localStr('lang_ticket_detail_task')}</Text>
        </View>
        <MoreContent style={styles.moreContent} content={content || ''} maxLine={5} />
      </View>
    );
  }

  _getIDView() {
    let rowData = this.state.rowData;
    let strId = rowData.ticketCode || '';
    let createDate = moment(rowData.createTime).format('YYYY-MM-DD HH:mm:ss');
    return (
      <View style={{
        paddingBottom: 16, paddingTop: 16, paddingLeft: 16, paddingRight: 16, backgroundColor: Colors.seBgLayout, marginTop: -2
        , alignItems: 'center'
      }}>
        <Text numberOfLines={1} style={{ fontSize: 13, color: Colors.seTextDisabled }}>
          {`${localStr('lang_ticket_detail_ticketId')}:${strId}`}
        </Text>
        <Text numberOfLines={1} style={{ fontSize: 13, color: Colors.seTextDisabled, marginTop: 6 }}>
          {`${rowData.createUserName} ${localStr('lang_ticket_detail_create_time')}${createDate}`}
        </Text>
      </View>
    )
  }

  _getTab() {
    return (
      <View style={{ height: 48, justifyContent: 'flex-end' }}>
        <Text style={{ fontSize: 17, marginBottom: 8, fontWeight: '600', color: Colors.text.primary }}>{`${localStr('lang_ticket_detail_log')}(${this.state.rowData.ticketLogs.length})`}</Text>
      </View>
    )
  }

  clickLog(log, index) {
    //判断日志是否自己创建，不是的无效
    if (log.userId !== userId) return null;
    this.setState({
      modalVisible: true,
      arrActions: [{
        title: localStr('lang_ticket_detail_edit_log'),
        click: () => {
          this.props.navigation.push('PageWarpper',{
            id: 'ticket_log_edit',
            component: TicketLogEdit,
            passProps: {
              title: localStr('lang_ticket_detail_edit_log'),
              tid: this.state.rowData.id,
              log,
              callBack: () => {
                this.props.navigation.pop();
                this._loadTicketDetail();
              },
              onBack: () => this.props.navigation.pop()
            }
          })
        }
      }, {
        title: localStr('lang_ticket_detail_del_log'),
        click: () => {
          SndAlert.alert(

            localStr('lang_ticket_log_del_confirm'),
              '',
            [
              { text: localStr('lang_ticket_filter_cancel'), onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
              {
                text: localStr('lang_ticket_log_del_ok'), onPress: async () => {
                  apiDelTicketLog({
                    id: log.ticketId,
                    logId: log.id
                  }).then(res => {
                    if (res.code === CODE_OK) {
                      let rowData = this.state.rowData;
                      rowData.ticketLogs.splice(index, 1);
                      rowData.ticketLogs = [].concat(rowData.ticketLogs);
                      this.setState({ rowData })
                    } else {
                      SndAlert.alert(localStr('lang_alert_title'), res.msg);
                    }
                  })
                }
              }
            ]
          )
        }
      }]
    })
  }

  _getLogMessage() {
    let logs = this.state.rowData.ticketLogs;
    let arr = logs.map((log, index) => {
      let imgs = log.pictures.map((img, imgIndex) => {
        return (
          <TouchableWithoutFeedback key={imgIndex} onPress={() => {
            this.props.navigation.push('PageWarpper',{
              id: 'ticket_log_edit',
              component: PhotoShowView,
              passProps: {
                index: imgIndex,
                onBack: () => this.props.navigation.pop(),
                data: log.pictures
              }
            })
          }}>
            <View style={{ width: this.picWid + 10, height: this.picWid + 10 }}>
              <CacheImage borderWidth={1} space={10} key={img.key} imageKey={img.key} width={this.picWid - 2} height={this.picWid - 2} />
            </View>

          </TouchableWithoutFeedback>

        )
      })
      return (
        <TouchableWithoutFeedback
          onLongPress={() => {
            if (this.state.isExecutor)
              this.clickLog(log, index);
          }}>
          <View style={{ paddingTop: 10, borderBottomColor: '#f2f2f2', borderBottomWidth: 1 }} key={index}>
            <Text style={{ fontSize: 17, lineHeight: 24, color: '#333' }}>{log.content}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {imgs}
            </View>
            <Text style={{ fontSize: 12, color: '#b2b2b2', marginVertical: 10 }}>{`${log.userName}  ${log.createTime}`}</Text>
          </View>
        </TouchableWithoutFeedback>

      )
    })
    return (
      <View style={{ backgroundColor: '#fff', margin: 16, marginTop: 0, borderRadius: 12 }}>
        <View style={{ marginLeft: 16 }}>
          {this._getTab()}
          <View style={{ height: 1, backgroundColor: LINE }} />
          {arr}
        </View>

      </View>
    )
  }
  _updateTicketAssetId(body) {
    apiUpdateAssetId(body).then(ret => {
      if (ret.code === CODE_OK) {
        // this.props.ticketChanged && this.props.ticketChanged();
        console.warn('------更新AssetID成功:', body, ret);
      } else {
        SndAlert.alert(localStr('lang_alert_title'), ret.msg);
      }
    })
  }
  _createNewAsset(arrNewAssets) {
    if (arrNewAssets.length === 0) {
      return;
    }

    let body = {
      spId: 70,
      customerId: customerId,
      userId: userId,
      userName: userName,
      objectId: this.state.rowData.objectId,
      objectType: this.state.rowData.objectType,
      initAssets: arrNewAssets,
    };
    // console.warn('------_createNewAsset:', body);
    // return;
    apiCreateNewAsset(body).then(ret => {
      if (ret.code === CODE_OK) {
        // this.props.ticketChanged && this.props.ticketChanged();
        this.showToast(localStr('lang_add_device_success_tip'))
        if (ret.data) {
          let reqArrs = [];
          ret.data.forEach(item => {
            if (item.newAssetId && item.currentAssetId) {
              let reqparam = {
                currentAssetId: item.currentAssetId,
                newAssetId: item.newAssetId,
                userId: userId,
                userName: userName,
              }
              reqArrs.push(reqparam);
            }
          })
          console.warn('------_updateTicketAssetId:', reqArrs);
          this._updateTicketAssetId({
            id: this.state.rowData.id,
            params: reqArrs,
          });
        }

      } else {
        SndAlert.alert(localStr('lang_alert_title'), ret.msg);
      }
    })
  }
  _createScrapTicket(arrScrapDevices) {
    console.warn('------_createScrapTicket:', arrScrapDevices.length);
    if (arrScrapDevices.length === 0) {
      return;
    }
    let createDate = moment().format('YYYY-MM-DD HH:mm:ss');
    let body = {
      title: '',
      startTime: createDate,
      endTime: createDate,
      executors: [{
        userId: userId,
        userName: userName,
      }],
      ticketType: 14,
      content: '',
      sysId: 1,
      sysClass: 1,
      userId: userId,
      userName: userName,
      scrapTime: createDate,
      objectId: this.state.rowData.objectId,
      objectType: this.state.rowData.objectType,
      assets: arrScrapDevices,
    }
    // console.warn('------_createScrapTicket333:', localStr('创建报废单成功!'));
    apiCreateScrapTicket(body).then(ret => {
      if (ret.code === CODE_OK) {
        console.warn('------', body, ret);
        // this.props.ticketChanged && this.props.ticketChanged();
        this.showToast(localStr('lang_add_scrap_ticket_tip'))

      } else {
        SndAlert.alert(localStr('lang_alert_title'), ret.msg);
      }
    })
  }
  _changeNonePandianToPankuiState(device) {
    let data = {
      "id": this.state.rowData.id,
      "assetId": device.assetId,
      "assetPointCheckState": 3,
      "assetRemark": "",
      "assetTags": [],
      "userId": userId,
      "userName": userName,
    }
    apiSubmitPointCheckResult(data).then(data => {
      if (data.code === '0' && data.data === true) {
        console.warn('----未盘资产自动盘亏处理结果：', data);
        // Toast.show(localStr('lang_scan_result_submit_success_tip'), {
        //   duration: 1000,
        //   position: -80,
        // });
      } else {
        Toast.show(localStr('lang_scan_result_submit_error_tip'), {
          duration: 1000,
          position: -80,
        });
      }
    })
  }

  /**
   * 修改设备状态
   * @param device
   * @param checkStatus 0 已盘 1 盘亏
   * @private
   */
  _checkDeviceStatus = (device, checkStatus) => {
    //这里转换提交参数格式
    let data = {
      "customerId": customerId,
      "deviceIds": [
        device.assetId
      ],
      "hierarchyId": device.locationId,
      "pointCheckStatus": checkStatus,
    }
    apiCheckDeviceStatus(data).then(data => {
      if (data.code === '0') {

      } else {
        //给出提示
        SndAlert.alert(data.msg || localStr('lang_ticket_detail_set_status_error'), "", [
          { text: localStr('lang_ticket_filter_ok'), onPress: () => { } }
        ]);
      }
    })
  }

  _updateDevicePandianStatus(device) {
    let data = {
      deviceId: device.assetId,
      deviceStatus: 5,//报废状态
    };
    apiUpdateDevicePointCheckStatus(data).then(data => {
      if (data.code === '0' && data.data === true) {
      } else {
        Toast.show(localStr('lang_scan_result_submit_error_tip'), {
          duration: 1000,
          position: -80,
        });
      }
    })
  }
  _approveTicket() {
    this.setState({
      submitModalVisible: false,
    })
    //审批通过
    apiCloseTicket({ id: this.state.rowData.id }).then(ret => {
      if (ret.code === CODE_OK) {
        this.props.ticketChanged && this.props.ticketChanged();
        this.showToast(localStr('lang_ticket_close_toast'))
        this._loadTicketDetail();
      } else {
        SndAlert.alert(localStr('lang_alert_title'), ret.msg);
      }
    })

    console.warn('-------', this.state.rowData.id);

    let isPanyingCheck = this.state.submitMenus[0].sel;
    let isNotPandianCheck = this.state.submitMenus[1].sel;
    let isPankuiCheck = this.state.submitMenus[2].sel;
    let isWillClearCheck = this.state.submitMenus[3].sel;
    let arrScrapDevices = [];
    let arrNewAssets = [];
    this.state.rowData.assets.forEach((item, index) => {
      // let canCheck = this.state.isExecutor && (item.extensionProperties && item.extensionProperties.assetPointCheckState === 1) && privilegeHelper.hasAuth(CodeMap.TICKET_MANAGEMENT_FULL)
      let state = item.extensionProperties?.assetPointCheckState;
      if (state === 4 && isPanyingCheck) {//盘盈资产----自动入库
        item.extensionProperties.assetInitData.id = item.assetId;
        arrNewAssets.push(item.extensionProperties.assetInitData);
      } else if (state === 1 && isNotPandianCheck) {//未盘----自动盘亏
        this._updateDevicePandianStatus(item);
        this._changeNonePandianToPankuiState(item);
        ///未盘资产自动盘亏处理,
        this._checkDeviceStatus(item, 1);
        if (item.extensionProperties && item.extensionProperties.assetPointCheckState) {
          item.extensionProperties.assetPointCheckState = 3;
        }
        arrScrapDevices.push(item);
      } else if (state === 3 && isPankuiCheck) {//盘亏
        this._updateDevicePandianStatus(item);
        arrScrapDevices.push(item);
      }
      let arrTags = item.extensionProperties?.assetTags;
      // console.warn("=========", index, arrTags, item.assetName);
      //待清理资产
      if (arrTags && arrTags.includes(localStr('lang_scan_result_page_tag2')) && isWillClearCheck) {
        this._updateDevicePandianStatus(item);
        arrScrapDevices.push(item);
      }
    });
    this._createScrapTicket(arrScrapDevices);
    this._createNewAsset(arrNewAssets);
  }

  _renderSubmittedButton() {
    return (
      <Bottom borderColor={Colors.transparent} backgroundColor={Colors.seBgContainer}>
        <Button
          style={[styles.button, {
            backgroundColor: Colors.seBrandNomarl,
            marginLeft: 16,
            flex: 1,
            borderRadius: 8,
          }]}
          textStyle={{
            fontSize: 16,
            color: Colors.seTextInverse
          }}
          text={localStr('lang_ticket_detail_approved')}
          onClick={() => this._showSubmitDialog()} />
      </Bottom>
    )
  }

  _executeTicket = () => {
    apiTicketExecute(this.state.rowData.id).then(ret => {
      if (ret.code === CODE_OK) {
        this.props.ticketChanged && this.props.ticketChanged();
        // this.showToast(localStr('lang_ticket_execute_toast'))
        this._loadTicketDetail();
      } else {
        SndAlert.alert(localStr('lang_alert_title'), ret.msg);
      }
    })
  }

  _writeLog() {
    this.props.navigation.push('PageWarpper',{
      id: 'ticket_log_edit',
      component: TicketLogEdit,
      passProps: {
        title: localStr('lang_ticket_detail_add_log'),
        tid: this.state.rowData.id,
        callBack: () => {
          this.props.navigation.pop();
          this._loadTicketDetail();
        },
        onBack: () => this.props.navigation.pop()
      }
    })
  }

  _doIgnore() {
    SndAlert.alert(
      localStr('lang_ticket_detail_ignore_confirm'),
        '',
      [
        { text: localStr('lang_ticket_filter_cancel'), onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
        {
          text: localStr('lang_ticket_detail_ignore'), onPress: async () => {
            apiIgnoreTicket({
              id: this.state.rowData.id
            }).then(ret => {
              if (ret.code === CODE_OK) {
                this.props.ticketChanged && this.props.ticketChanged();
                this._loadTicketDetail();
              } else {
                SndAlert.alert(localStr('lang_alert_title'), ret.msg);
              }
            })
          }
        }
      ])
  }

  _submitTicket() {
    let ticketLogs = this.state.rowData.ticketLogs;
    if (!ticketLogs || ticketLogs.length === 0) {
      // Alert.alert(localStr('lang_alert_title'), localStr('lang_ticket_submit_invalid'));
      // return;
    }

    apiSubmitTicket({ id: this.state.rowData.id }).then(ret => {
      if (ret.code === CODE_OK) {
        this.props.ticketChanged && this.props.ticketChanged();
        this._loadTicketDetail();
        this.showToast(localStr('lang_ticket_detail_submit_success'));
      } else {
        SndAlert.alert(localStr('lang_alert_title'), ret.msg);
      }
    })
  }

  _canExecute = () => {
    return privilegeHelper.hasAuth(CodeMap.AssetTicketExecute) && this.state.isExecutor;
  }

  _getButton(isScollView) {
    let status = this.state.rowData.ticketState;
    if ((this.state.isExecutor && status === STATE_NOT_START && privilegeHelper.hasAuth(CodeMap.AssetTicketExecute)) && !isScollView) {
      let btnLabel = localStr('lang_ticket_detail_begin_execute');
      //还需要判断是否是创建者和有工单执行权限
      return (
        <Bottom borderColor={Colors.transparent} backgroundColor={Colors.seBgContainer}>

          <Button
            style={[styles.button, {
              backgroundColor: Colors.seBrandNomarl, marginLeft: 16, flex: 1, borderRadius: 8
            }]}
            textStyle={{
              fontSize: 16,
              color: Colors.seTextInverse
            }}
            text={btnLabel} onClick={this._executeTicket} />
        </Bottom>
      );
    }

    if (status === STATE_PENDING_AUDIT && privilegeHelper.hasAuth(CodeMap.AssetTicketFull)) {//表示已提交工单
      return this._renderSubmittedButton();
    }
    //执行中和已驳回操作一样
    if (this.state.isExecutor && (status === STATE_STARTING || status === STATE_REJECTED) && privilegeHelper.hasAuth(CodeMap.AssetTicketExecute) && !isScollView) {
      return (
        <Bottom borderColor={Colors.transparent} backgroundColor={Colors.seBgContainer}>
          {/* <View style={{ flexDirection: 'row', flex: 1 }}>
            <View style={{ flex: 1 }}>
              {logButton}
            </View>
          </View> */}
          <View style={{ flex: 3, alignItems: 'center', marginHorizontal: 16, flexDirection: 'row', height: 40, borderRadius: 8, backgroundColor: Colors.seBrandNomarl, }}>
            <TouchableOpacity style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} onPress={this._addNewInventory}>
              <Text style={{ color: Colors.seTextInverse, fontSize: 14 }}>{localStr('lang_ticket_detail_add_device')}</Text>
            </TouchableOpacity>
            <View style={{ width: 1, height: 20, backgroundColor: Colors.seBrandHoverd }} />
            {!this.state.canScan ? null :
              <>
                <TouchableOpacity style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} onPress={this._scanInventory}>
                  <Text style={{ color: Colors.seTextInverse, fontSize: 14 }}>{localStr('lang_ticket_detail_scan_device')}</Text>
                </TouchableOpacity>
                <View style={{ width: 1, height: 20, backgroundColor: Colors.seBrandHoverd }} />
              </>
            }
            <TouchableOpacity style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} onPress={() => this._submitTicket()}>
              <Text style={{ color: Colors.seTextInverse, fontSize: 14 }}>{localStr('lang_ticket_detail_submit_ticket')}</Text>
            </TouchableOpacity>
          </View>

          {/*<Button*/}
          {/*  style={[styles.button,{*/}
          {/*    backgroundColor:GREEN,*/}
          {/*    marginLeft:0,*/}
          {/*    flex:3,*/}
          {/*  }]}*/}
          {/*  textStyle={{*/}
          {/*    fontSize:16,*/}
          {/*    color:'#ffffff'*/}
          {/*  }}*/}
          {/*  text={localStr('lang_ticket_detail_submit_ticket')}*/}
          {/*  onClick={() => this._submitTicket()} />*/}
        </Bottom>
      );
    }
    return null;
  }


  //新增盘盈
  _addNewInventory = () => {
    console.log('add inventory')
    if (!this.state.rowData.extensionProperties?.objectName) {
      this.showToast(localStr('lang_ticekt_detail_info_exception'));
      return;
    }
    this.props.navigation.push('PageWarpper',{
      id: 'device_add',
      component: DeviceAdd,
      passProps: {
        ticketId: this.state.rowData.id,
        objectId: this.state.rowData.objectId,
        objectType: this.state.rowData.objectType,
        placeAt: this.state.rowData.extensionProperties?.objectName,
        onRefresh: () => {
          this._loadTicketDetail()
        }
      }
    })
  }

  //扫描盘点
  _scanInventory = () => {
    this.props.navigation.push('PageWarpper',{
      id: 'scan_device',
      component: Scan,
      passProps: {
        onRefresh: () => this._loadTicketDetail(),
        scanResult: (result, type, onReset) => {
          if (type == 'device') {
            let device = this.state.rowData.assets.find((item) => item.assetId === result.DeviceId);
            if (!device) {
              SndAlert.alert(localStr('lang_ticket_detail_not_include_device'), null,
                [
                  {
                    text: localStr('lang_scan_page_alert_error_button'), onPress: () => {
                      onReset();
                      return;
                    }
                  }
                ]
              )
              return;
            } else {
              this._gotoPointCheckResult(device);
            }
          }
        }
        // updateExecutingDetailInfo(result);
      }
    })
  }
  _deleteDevice(device, index) {
    if (device.extensionProperties?.assetPointCheckState !== 4) {
      return;
    }
    SndAlert.alert(
      localStr(localStr('lang_ticket_detail_delete_device_confirm')),
        '',
      [
        { text: localStr('lang_ticket_filter_cancel'), onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
        {
          text: localStr('lang_ticket_log_del_ok'), onPress: async () => {
            apiRemoveTicketInitAsset({
              id: this.state.rowData.id,
              assetId: device.assetId
            }).then(res => {
              if (res.code === CODE_OK) {
                this._loadTicketDetail();
              } else {
                SndAlert.alert(localStr('lang_alert_title'), res.msg);
              }
            })
          }
        }
      ]
    )
  }
  _gotoPointCheckResult(device) {
    this._showInventoryMenu(device);
  }
  _getToolbar(data) {
    this._actions = [];
    let actionSelected = [];
    if (data) {
      var status = data.ticketState;
      //如果有错误信息，不显示分享按钮
      if (!this.props.errorMessage) {
        // this._actions = [
        //   {
        //     title:localStr('lang_ticket_detail_share'),
        //     iconType:'share',
        //     show: 'always', showWithText: false
        //   }
        // ];
        //   actionSelected.push((item)=>{
        //     if(this.refs.viewShot){
        //
        //       this.refs.viewShot.capture().then(uri => {
        //         CameraRoll.saveToCameraRoll(uri);
        //         const shareOptions = {
        //           title: localStr('lang_ticket_detail_share'),
        //           url: uri,
        //           failOnCancel: false,
        //         };
        //         Share.open(shareOptions);
        //       });
        //     }
        //   })
      }
      if ((status === STATE_NOT_START || status === STATE_STARTING || status === STATE_REJECTED)
        && (privilegeHelper.hasAuth(CodeMap.AssetTicketFull))) {
        this._actions.push({
          title: localStr('lang_ticket_detail_edit'),
          iconType: 'edit',
          show: 'always', showWithText: false
        });
        actionSelected.push(() => {
          this.setState({
            modalVisible: true,
            arrActions: [{
              title: localStr('lang_ticket_detail_change_executors'),
              click: () => {
                this.props.navigation.push('PageWarpper',{
                  id: 'ticket_select_executors',
                  component: TicketSelectExecutors,
                  passProps: {
                    executors: this.state.rowData.executors,
                    title: localStr('lang_ticket_detail_change_executors'),
                    assets: this.state.rowData.assets.map(item => {
                      return {
                        // locationId:item.locationId,
                        // locationType:item.locationType,
                        locationId: item.assetId,
                        locationType: item.assetType,
                        // assetId:item.assetId,
                        // assetType:item.assetType
                      }
                    }),
                    onChangeExecutors: (users) => {
                      let data = users;//[].concat(users).concat(this.state.rowData.executors);
                      apiEditTicket({
                        id: this.state.rowData.id,
                        executors: data,
                      }).then(ret => {
                        if (ret.code === CODE_OK) {
                          this.props.ticketChanged && this.props.ticketChanged();
                          this._loadTicketDetail();
                        } else {
                          //出错信息
                          SndAlert.alert(localStr('lang_alert_title'), ret.msg)
                        }
                      })
                    },
                    onBack: () => this.props.navigation.pop()
                  }
                })
              }
            }, {
              title: localStr('lang_ticket_detail_change_time'),
              click: () => {
                this.props.navigation.push('PageWarpper',{
                  id: 'ticket_select_time',
                  component: TicketSelectTime,
                  passProps: {
                    title: localStr('lang_ticket_detail_change_time'),
                    startTime: this.state.rowData.startTime,
                    endTime: this.state.rowData.endTime,
                    canEditStart: status === STATE_NOT_START,
                    onChangeDate: (startTime, endTime) => {
                      let data = {
                        endTime,
                        id: this.state.rowData.id
                      }
                      if (status === STATE_NOT_START) {
                        data.startTime = startTime
                      }
                      apiEditTicket(data).then(res => {
                        if (res.code === CODE_OK) {
                          this.props.ticketChanged && this.props.ticketChanged();
                          this._loadTicketDetail();
                        } else {
                          SndAlert.alert(localStr('lang_alert_title'), res.msg)
                        }
                      })
                    },
                    onBack: () => this.props.navigation.pop()
                  }
                })
              }
            }]
          })
        });
      }
    }
    return (
      <Toolbar
        title={localStr('lang_ticket_detail')}
        navIcon="back"
        color={Colors.seBrandNomarl}
        borderColor={Colors.seBrandNomarl}
        onIconClicked={() => {
          this.props.navigation.pop()
        }}
        actions={this._actions}
        onActionSelected={actionSelected}
      />
    );
  }

  componentDidMount() {
    this._msgLongPress = DeviceEventEmitter.addListener('msgLongPress', menu => {
      this._showMenu(menu);
    });
    this._logLongPress = DeviceEventEmitter.addListener('logLongPress', menu => {
      this._showMenu(menu);
    });
    InteractionManager.runAfterInteractions(() => {
      this._loadTicketDetail();
    })

  }




  _checkDeviceStatus = (device, checkStatus) => {
    //这里转换提交参数格式
    let data = {
      "customerId": customerId,
      "deviceIds": [
        device.assetId
      ],
      "hierarchyId": device.locationId,
      "pointCheckStatus": checkStatus,
      //"userId": 813928
    }
    apiCheckDeviceStatus(data).then(data => {
      if (data.code === CODE_OK) {
        if (this.state.localDeviceState) {
          this.state.localDeviceState[device.assetId] = checkStatus
          this.setState({})
        }
        this._loadTicketDetail();
      } else {
        //给出提示
        SndAlert.alert(data.msg || localStr('lang_ticket_detail_set_status_error'),"",  [
          { text: localStr('lang_ticket_filter_ok'), onPress: () => { } }
        ]);
      }
    })
  }

  _loadDeviceStatus(data) {
    apiTicketDeviceStatus(data).then(data => {
      if (data.code === CODE_OK) {
        data.data.forEach(device => {
          if (device.logo) {
            let logo = JSON.parse(device.logo);
            if (logo) {
              //如果是数组
              if (logo instanceof Array && logo.length > 0) {
                device.logoUrl = logo[0].key;
              } else if (logo instanceof Object && logo.key) {
                device.logoUrl = logo.key
              }
              if (device.logoUrl) {
                if ('device.logoUrl'.indexOf('/hardcore/') !== 0) {
                  device.logoUrl = '/hardcore/se-xsup-static/' + device.logoUrl
                }
                device.logoUrl = getBaseUri() + device.logoUrl;
              }
              //如果是对象
            }
          }
          let findAsset = this.state.rowData.assets.find(asset => asset.assetId === device.deviceId);
          Object.assign(findAsset, device);
        })
        this.setState({})
      } else {
        //给出提示
      }
    })
  }

  _loadTicketDetail() {
    //获取工单详情
    this.setState({ isFetching: true })
    apiTicketDetail(this.props.ticketId).then(data => {
      if (data.code === CODE_OK) {
        if (!this._isLoad) {
          this._isLoad = true;
          if (data.data.ticketState === STATE_NOT_START) {
            this.setState({ localDeviceState: {} })
          }

        }
        this._loadDeviceStatus({
          deviceId: data.data.assets.map(asset => asset.assetId).join(',')
        })
        //获取详情ok
        let isCreateUser = data.data.createUser === userId;
        let isExecutor = false;//data.data.executors.incl
        if (data.data.executors) {
          let find = data.data.executors.find(item => item.userId === userId);
          if (find) isExecutor = true;
        }

        let rejectData = null
        if (data.data.ticketState === STATE_REJECTED) {
          rejectData = data.data.ticketOperateLogs.filter(item => item.operationType === REJECT_OPERATION_TYPE)
            .sort((a, b) => {
              return moment(b.createTime).toDate().getTime() - moment(a.createTime).toDate().getTime()
            })[0];
        };
        let canManual = false;
        let canScan = false;
        let mode = data.data.extensionProperties?.mode
        if (Array.isArray(mode) && mode.length > 0) {
          mode.forEach(m => {
            switch (m.value) {
              case 0:
                canScan = true;
                break;
              case 1:
                canManual = true;
                break;
            }
          })
        }
        this.setState({
          rowData: data.data,
          isCreateUser,
          rejectData,
          isFetching: false,
          isExecutor,
          canManual, canScan
        })
      } else {
        this.setState({
          errorMessage: data.msg, isFetching: false
        })
      }
    })
  }

  componentWillUnmount() {
    this._msgLongPress.remove();
    this._logLongPress.remove();
  }

  _showMenu(menu) {
    this.setState({ 'modalVisible': true, arrActions: menu, title: '' });
  }

  _getActionSheet() {
    var arrActions = this.state.arrActions;
    if (!arrActions) {
      return;
    }
    if (this.state.modalVisible) {
      return (
        <SchActionSheet title={this.state.title} arrActions={arrActions} modalVisible={this.state.modalVisible}
          onCancel={() => {
            this.setState({ 'modalVisible': false });
          }}
          onSelect={item => {
            this.setState({ modalVisible: false }, () => {
              setTimeout(() => {
                item.click();
              }, 200);
            });
          }}
        >
        </SchActionSheet>
      )
    }
  }

  _renderRejection() {
    //只有驳回状态，才显示驳回原因，驳回状态是23
    let status = this.state.rowData.ticketState;
    if (status !== STATE_REJECTED || !this.state.rejectData) return null;
    let reason = this.state.rejectData?.content || '';
    let RejectUser = this.state.rejectData.userName
    let rejectTime = moment(this.state.rejectData.createTime).format('YYYY-MM-DD HH:mm:ss');
    return (
      <View style={{ backgroundColor: Colors.seWarningBg, padding: 16, marginBottom: 0, flexDirection:'row'}}>
        <Image source={require('./images/reject/Union.png')} style={{width: 14, height: 14, marginTop: 3}}/>
        <View style={{marginLeft: 8}}>
          <Text style={{ fontSize: 14, color: Colors.seTextTitle, }}>{localStr('lang_ticket_detail_reject_reason')}</Text>
          <Text style={{ fontSize: 14, color: Colors.seTextTitle, marginTop: 6}}>{reason}</Text>
          <Text style={{ fontSize: 12, color: Colors.seTextSecondary, marginTop: 6 }}>{`${RejectUser}  ${rejectTime}`}</Text>
        </View>

      </View>
    )
  }

  showToast(msg) {
    this.setState({
      showToast: true,
      toastMessage: msg
    });
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      this.setState({
        showToast: false,
        toastMessage: ''
      });
    }, 3500);
  }

  _showInventoryMenu = (device) => {
    let Cmp = ScanResult;
    //如果是盘盈设备，跳转到盘盈的新增页面
    if (device.extensionProperties?.assetPointCheckState === 4) {
      Cmp = DeviceAdd;
    }
    this.props.navigation.push('PageWarpper',{
      id: 'ticket_pd',
      component: Cmp,
      passProps: {
        title: '',
        tid: this.state.rowData.id,
        device: device,
        placeAt: this.state.rowData.extensionProperties?.objectName,
        ticketId: this.state.rowData.id,
        objectId: this.state.rowData.objectId,
        objectType: this.state.rowData.objectType,
        onRefresh: () => this._loadTicketDetail(),
        callBack: () => {
          // this.props.navigation.pop();
          // this._loadTicketDetail();
        },
        onBack: () => this.props.navigation.pop()
      }
    })
  }

  _renderInventoryDeviceList() {
    let status = this.state.rowData.ticketState;
    let arrStatus = new Array(5).fill(0);
    let canCheck = (this.state.rowData.ticketState === STATE_REJECTED || this.state.rowData.ticketState === STATE_STARTING)
      && this._canExecute() && this.state.canManual;
    const devices = this.state.rowData.assets.map((item, index) => {
      // let canCheck = this.state.isExecutor && (item.extensionProperties && item.extensionProperties.assetPointCheckState === 1) && privilegeHelper.hasAuth(CodeMap.TICKET_MANAGEMENT_FULL)
      let imgUrl = null;
      let defaultImg = isDarkMode() ? require('./images/building_default/placeholder.png') : require('./images/building_default/building.png');
      if (item.extensionProperties && item.extensionProperties?.assetLogo) {
        try {
          let jsonLogo = JSON.parse(item.extensionProperties?.assetLogo);
          imgUrl = jsonLogo[0].key;
        } catch (error) {
          imgUrl = null;
        }

        // imgUrl = "668673300442906624";
      }
      //数据好像变化了，这个给出兼容显示
      if (!imgUrl && item.logo) {
        try {
          let jsonLogo = JSON.parse(item.logo);
          imgUrl = jsonLogo[0].key;
        } catch (error) {
          imgUrl = null;
        }
      }
      //这里给出
      if (!item.extensionProperties || !item.extensionProperties.assetPointCheckState) {
        item.extensionProperties = {
          ...item.extensionProperties,
          assetPointCheckState: 1
        }
      }
      if (item.extensionProperties && item.extensionProperties.assetPointCheckState) {
        arrStatus[item.extensionProperties.assetPointCheckState] += 1;
      }
      if (this.state.deviceTab != 0 && item.extensionProperties &&
        this.state.deviceTab != item.extensionProperties.assetPointCheckState) {
        return;
      }
      return (
        <TouchFeedback
          enabled={canCheck}// 执行中和已驳回状态，可以重复盘点
          //style={{flex:1,backgroundColor:'transparent'}}
          key={String(index)}
          onPress={() => this._showInventoryMenu(item, index)}
          onLongPress={() => this._deleteDevice(item, index)}
        >
          <View key={index} style={{
            flexDirection: 'row', alignItems: 'center', marginTop: 10, borderTopColor: Colors.seBgLayout,
            borderTopWidth: 1, paddingTop: 10
          }}>
            <View style={{ borderRadius: 8, overflow: 'hidden', }}>
              <CacheImage borderWidth={0} space={0} key={imgUrl} imageKey={imgUrl} defaultImgPath={defaultImg} width={96} height={54} />
            </View>

            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={{ color: Colors.seTextTitle, fontSize: 14, fontWeight:'bold' }}>{item.assetName}</Text>
              <Text style={{ color: Colors.seTextPrimary, fontSize: 12, marginTop: 8 }}>{`${localStr('lang_scan_result_label10')}：${item.code || item.extensionProperties?.assetCode || ''}`}</Text>
            </View>
            {
              this.state.rowData.ticketState === STATE_NOT_START ? null :
                <TouchFeedback enabled={canCheck} style={{ height: 50, width: 60, alignItems: 'center' }} onPress={() => this._showInventoryMenu(item)}>
                  {
                    // ((this.state.localDeviceState && !this.state.localDeviceState[item.assetId] && this.state.localDeviceState[item.assetId] !== 0)
                    // || (!item.status && item.status !== 0)) ?
                    (item.extensionProperties && item.extensionProperties.assetPointCheckState === 1) ?
                      <Text style={{ fontSize: 12, color: Colors.seBrandNomarl, marginTop: 8 }}>{this.state.canManual && this._canExecute() ? localStr('lang_ticket_detail_device_check') : ''}</Text> :
                      <Image style={{ width: 60, height: 60 }} source={getInventoryIcon(item.extensionProperties?.assetPointCheckState)} />
                  }
                </TouchFeedback>
            }
          </View>
        </TouchFeedback>

      )
    })
    arrStatus[0] = this.state.rowData.assets.length;
    return (
      <View style={{ margin: 16, marginTop: 0, borderRadius: 12, backgroundColor: Colors.seBgContainer, padding: 16 }}>
        {this._renderInventoryTabs(arrStatus)}
        {devices}
      </View>
    )
  }

  _renderInventoryTabs(arrStatus) {
    let tabs = [
      `${localStr('lang_ticket_detail_device_tab1')}(${arrStatus[0]})`,
      `${localStr('lang_ticket_detail_device_tab2')}(${arrStatus[1]})`,
      `${localStr('lang_ticket_detail_device_tab3')}(${arrStatus[2]})`,
      `${localStr('lang_ticket_detail_device_tab4')}(${arrStatus[3]})`,
      `${localStr('lang_ticket_detail_device_tab5')}(${arrStatus[4]})`
    ];
    return (
      <View style={{ marginBottom: -10, flexDirection: 'row', justifyContent: 'space-between' }}>
        {
          tabs.map((item, index) => {
            let isSel = index === this.state.deviceTab;
            return (
              <TouchableOpacity onPress={() => this.setState({ deviceTab: index })}>
                <Text style={{ fontSize: 12, color: isSel ? Colors.seBrandNomarl : Colors.seTextSecondary }}>{item}</Text>
                <View style={{ height: 1, marginTop: 12, backgroundColor: isSel ? Colors.seBrandNomarl : undefined }} />
              </TouchableOpacity>
            )
          })
        }
      </View>
    )
  }

  _renderToast() {
    if (!this.state.showToast) return null;
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={this.state.showToast}
        onRequestClose={() => { }}>
        <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
          <View style={{ borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#00000099', marginBottom: 120 }}>
            <Text style={{ fontSize: 15, color: '#fff' }}>{this.state.toastMessage}</Text>
          </View>
        </View>
      </Modal>
    )
  }

  _makeMenus() {
    return [
      { title: localStr('lang_ticket_detail_submit_check1'), sel: false },
      { title: localStr("lang_ticket_detail_submit_check2"), sel: false },
      { title: localStr('lang_ticket_detail_submit_check3'), sel: false },
      // { title: localStr('lang_ticket_detail_submit_check4'), sel: false },
      { title: localStr('lang_ticket_detail_submit_check5'), sel: false },
    ]
  }

  _showSubmitDialog() {
    this.setState({
      submitModalVisible: true,
      submitMenus: this._makeMenus()
    })
    // this._approveTicket();
  }

  _renderSubmitDialog() {
    if (!this.state.submitModalVisible) return;
    //icon 161
    let arrMenus = this.state.submitMenus;
    let menus = this.state.submitMenus.map((m, index) => {
      return (
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}
          onPress={() => {
            m.sel = !m.sel;
            this.setState({});
          }}
        >
          <View style={{
            width: 16, height: 16, justifyContent: 'center', alignItems: 'center', borderRadius: 2, borderWidth: 1,
            borderColor: Colors.seBorderBase, marginRight: 6
          }}>
            {!m.sel ? null :
              <Icon type={'icon_check'} color={Colors.seGreen} size={14} />
            }
          </View>
          <Text style={{ fontSize: 14, color: Colors.seTextPrimary }}>{m.title}</Text>
        </TouchableOpacity>
      )
    })
    return (
      <CommonDialog modalVisible={this.state.submitModalVisible} title={localStr('lang_ticket_detail_approved')}>
        <View style={{ padding: 16, borderRadius: 12, backgroundColor: Colors.seBgElevated, marginHorizontal: 32 }}>
          <Text style={{ fontSize: 17, color: Colors.seTextTitle, fontWeight: '600', alignSelf: 'center' }}>{localStr('lang_ticket_detail_approved')}</Text>
          {menus}
          <View style={{
            borderTopColor: Colors.seTextDisabled, flexDirection: 'row', height: 40, borderTopWidth: 1, marginHorizontal: -16,
            marginBottom: -16, marginTop: 16
          }}>
            <TouchableOpacity style={{ flex: 1, height: 40, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => this.setState({ submitModalVisible: false })}>
              <Text style={{ color: Colors.seInfoNormal, fontSize: 17 }}>{localStr('lang_ticket_filter_cancel')}</Text>
            </TouchableOpacity>
            <View style={{ width: 1, backgroundColor: Colors.seTextDisabled }} />
            <TouchableOpacity style={{ flex: 1, height: 40, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => this._approveTicket()}>
              <Text style={{ color: Colors.seInfoNormal, fontSize: 17 }}>{localStr("lang_ticket_filter_ok")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity onPress={() => this.setState({ submitModalVisible: false })} style={{ flex: 1 }} />
      </CommonDialog>
    )
  }

  render() {
    if (!this.state.isFetching && this.state.errorMessage) {
      return (
        <View style={{ flex: 1, backgroundColor: Colors.seBgContainer }}>
          {this._getToolbar(this.props.rowData)}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 17, color: Colors.text.sub }}>{this.state.errorMessage}</Text>
          </View>
        </View>
      )
    }
    if (this.state.isFetching || !this.state.rowData) {
      return (
        <View style={{ flex: 1, backgroundColor: Colors.seBgContainer }}>
          {this._getToolbar(this.state.rowData)}
          <Loading />
        </View>
      )
    }

    var marginBottom = { marginBottom: bottomHeight };

    //已提交工单没有按钮，已开始按钮，在scrollview内，如果没有权限，按钮也不显示
    var bottomButton = this._getButton(false);
    if (!bottomButton) {
      marginBottom = null;
    }

    if (bottomButton) {
      if (Platform.OS === 'ios') {
        bottomButton = (
          <View style={{ backgroundColor: Colors.background.white }}>
            <View style={{ marginBottom: (isPhoneX() ? 32 : 16) }}>
              {bottomButton}
            </View>
          </View>
        );
      } else {
        bottomButton = (
          <View style={{ paddingBottom: 16, backgroundColor: Colors.seBgContainer , height: 84}}>
            {bottomButton}
          </View>
        );
      }
    }

    return (
      <View style={{ flex: 1, backgroundColor: Colors.seBgLayout}}>
        {this._getToolbar(this.state.rowData)}
        <ScrollView showsVerticalScrollIndicator={false} style={[styles.wrapper]}>
          <ViewShot style={{ flex: 1, backgroundColor: Colors.seBgLayout}} ref="viewShot" options={{ format: "jpg", quality: 0.9 }}>
            {/*{this._getAssetView()}*/}
            {this._renderRejection()}
            {this._renderInventoryTicketInfo()}
            {this._renderInventoryDeviceList()}
            {/* {this._renderRejection()} */}
            <View style={{ height: 1, backgroundColor: Colors.seBorderSplit, marginLeft: 16 }} />
            {/*{this._getTaskView()}*/}
            <View style={{ height: 1, backgroundColor: Colors.seBorderSplit, marginLeft: 16 }} />
            {/*{this._getDocumentsView()}*/}
            {/* {this._getLogMessage()} */}
            {this._getIDView()}
          </ViewShot>
        </ScrollView>
        {bottomButton}
        {this._getActionSheet()}
        {this._renderToast()}
        {this._renderSubmitDialog()}
      </View>
    );
  }
}

var bottomHeight = 54;

var styles = StyleSheet.create({
  statusRow: {
    height: 69,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: TICKET_STATUS
  },
  statusText: {
    fontSize: 17,
    color: BLACK
  },
  moreContent: {
    margin: 16,
    marginTop: 0,
    marginBottom: 13,
    backgroundColor: 'white'
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    height: bottomHeight,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    height: 40,
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 2,

  },
  wrapper: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
