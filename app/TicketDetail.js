
'use strict';
import React, { Component } from 'react';

import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  DeviceEventEmitter,
  Text, Dimensions, Alert, TouchableOpacity, TouchableWithoutFeedback, Modal, Image, InteractionManager
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

import { localStr } from "./utils/Localizations/localization";
import NetworkImage from './components/NetworkImage'
import {
  apiCheckDeviceStatus,
  apiCloseTicket,
  apiCreateTicket,
  apiDelTicketLog,
  apiEditTicket,
  apiGetTicketExecutors, apiIgnoreTicket, apiRejectTicket, apiSubmitTicket,
  apiTicketDetail, apiTicketDeviceStatus, apiRemoveTicketInitAsset,
  apiTicketExecute, apiTicketLostDevices, customerId, getBaseUri,
  userId
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
// import Share from "react-native-share";

const DEVICE_STATUS = [
  // { name: '在用', type: 0, icon: require('./images/device_status/device_new.png') },
  // { name: '缺失', type: 1, icon: require('./images/device_status/device_new.png') },
  { name: '已盘', type: 2, icon: require('./images/device_status/device_already_pd.png') },
  { name: '盘亏', type: 3, icon: require('./images/device_status/device_loss.png') },
  { name: '盘盈', type: 4, icon: require('./images/device_status/device_new.png') },
]

const DEVICE_STATUS_ICON = {
  0: require('./images/device_status/device_new.png'),
  1: require('./images/device_status/device_new.png'),
  2: require('./images/device_status/device_already_pd.png'),
  3: require('./images/device_status/device_loss.png'),
  4: require('./images/device_status/device_new.png'),
}

function makeTestDevices() {
  return [
    { name: '空调', code: 'FCCD-77498489489' },
    { name: '冰箱', code: 'FCCD-77498489481' },
    { name: '净水器', code: 'FCCD-77498489482' },
    { name: '洗碗机', code: 'FCCD-77498489483' }
  ]
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
    this.state = { toolbarOpacity: 0, showToolbar: false, forceStoped: false, deviceList: null, deviceTab: 0 };
  }

  _renderInventoryTicketInfo() {
    return (
      <View style={{ margin: 16, padding: 16, backgroundColor: "#fff", borderRadius: 12 }}>
        <Text style={{ fontSize: 16, color: '#333', fontWeight: '600' }}>{this.state.rowData.title}</Text>
        <Text style={{ fontSize: 12, color: '#666', marginVertical: 8 }}>
          {`执行时间：${moment(this.state.rowData.startTime).format('YYYY年MM月DD日')} - ${moment(this.state.rowData.endTime).format('YYYY年MM月DD日')}`}
        </Text>
        <Text style={{ fontSize: 12, lineHeight: 20, color: '#666', }}>{`执行人：${this.state.rowData.executors.map(item => item.userName).join('、')}`}</Text>
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
  // _getDocumentsView(){
  //   var {rowData} = this.props;
  //   var startTime = moment(rowData.get('StartTime')).format('YYYY-MM-DD'),
  //     endTime = moment(rowData.get('EndTime')).format('YYYY-MM-DD');
  //   var executor = rowData.get('ExecutorNames').join('、');
  //   var documents = rowData.get('Documents').map((item)=> {return {name:item.get('DocumentName'),id:item.get('DocumentId'),size:item.get('Size')}}).toArray();
  //   var content = [
  //     // {label:'执行时间',value:`${startTime} 至 ${endTime}`},
  //     // {label:'执行人',value:executor},
  //     {label:'作业文档',value:documents}
  //   ];
  //   var style={marginHorizontal:16,marginBottom:16};
  //   if (Platform.OS === 'ios') {
  //     style={marginHorizontal:16,marginBottom:8,marginTop:8};
  //   }
  //   if (!documents||documents.length===0) {
  //     return ;
  //   }
  //   return (
  //     <View style={{backgroundColor:'white'}}>
  //       <View style={{paddingBottom:15,paddingHorizontal:16,}}>
  //         <View style={{paddingTop:16,paddingBottom:11,
  //           flexDirection:'row',alignItems:'center',
  //         }}>
  //           <Text style={{fontSize:17,color:'black',fontWeight:'bold'}}>{'作业文档'}</Text>
  //         </View>
  //         {
  //           content.map((item,index) => {
  //             return (
  //               <LabelValue key={index} style={{marginBottom:0,}} label={item.label} value={item.value} forceStoped={this.state.forceStoped}/>
  //             )
  //           })
  //         }
  //       </View>
  //       <ListSeperator marginWithLeft={16}/>
  //     </View>
  //   )
  // }
  _getIDView() {
    let rowData = this.state.rowData;
    let strId = rowData.ticketCode || '';
    let createDate = moment(rowData.createTime).format('YYYY-MM-DD HH:mm:ss');
    return (
      <View style={{
        paddingBottom: 16, paddingTop: 16, paddingLeft: 16, paddingRight: 16, backgroundColor: LIST_BG, marginTop: -2
        , alignItems: 'center'
      }}>
        <Text numberOfLines={1} style={{ fontSize: 13, color: '#999' }}>
          {`${localStr('lang_ticket_detail_ticketId')}:${strId}`}
        </Text>
        <Text numberOfLines={1} style={{ fontSize: 13, color: '#999', marginTop: 6 }}>
          {`${rowData.createUserName} ${localStr('lang_ticket_detail_create_time')}${createDate}`}
        </Text>
      </View>
    )
  }

  _getTab() {
    return (
      <View style={{ height: 48, justifyContent: 'flex-end' }}>
        <Text style={{ fontSize: 17, marginBottom: 8, fontWeight: '600', color: '#333' }}>{`${localStr('lang_ticket_detail_log')}(${this.state.rowData.ticketLogs.length})`}</Text>
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
          this.props.navigator.push({
            id: 'ticket_log_edit',
            component: TicketLogEdit,
            passProps: {
              title: localStr('lang_ticket_detail_edit_log'),
              tid: this.state.rowData.id,
              log,
              callBack: () => {
                this.props.navigator.pop();
                this._loadTicketDetail();
              },
              onBack: () => this.props.navigator.pop()
            }
          })
        }
      }, {
        title: localStr('lang_ticket_detail_del_log'),
        click: () => {
          Alert.alert(
            '',
            localStr('lang_ticket_log_del_confirm'),
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
                      Alert.alert(localStr('lang_alert_title'), res.msg);
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
            this.props.navigator.push({
              id: 'ticket_log_edit',
              component: PhotoShowView,
              passProps: {
                index: imgIndex,
                onBack: () => this.props.navigator.pop(),
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
        Alert.alert(localStr('lang_alert_title'), ret.msg);
      }
    })
  }

  _renderSubmittedButton() {
    return (
      <Bottom borderColor={'#f2f2f2'} height={54} backgroundColor={'#fff'}>

        {/*<Button*/}
        {/*  style={[styles.button,{borderWidth:1,borderColor:'#888',*/}
        {/*    backgroundColor:'#fff',marginLeft:16,flex:1,marginRight:0*/}
        {/*  }]}*/}
        {/*  textStyle={{*/}
        {/*    fontSize:16,*/}
        {/*    color:'#888'*/}
        {/*  }}*/}
        {/*  text={'驳回'}*/}
        {/*  onClick={() => this._rejectTicket()} />*/}
        <Button
          style={[styles.button, {
            backgroundColor: GREEN,
            marginLeft: 16,
            flex: 1,
            borderRadius: 2,
          }]}
          textStyle={{
            fontSize: 16,
            color: '#ffffff'
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
        this.showToast(localStr('lang_ticket_execute_toast'))
        this._loadTicketDetail();
      } else {
        Alert.alert(localStr('lang_alert_title'), ret.msg);
      }
    })
  }

  _writeLog() {
    this.props.navigator.push({
      id: 'ticket_log_edit',
      component: TicketLogEdit,
      passProps: {
        title: localStr('lang_ticket_detail_add_log'),
        tid: this.state.rowData.id,
        callBack: () => {
          this.props.navigator.pop();
          this._loadTicketDetail();
        },
        onBack: () => this.props.navigator.pop()
      }
    })
  }

  _doIgnore() {
    Alert.alert(
      '',
      localStr('lang_ticket_detail_ignore_confirm'),
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
                Alert.alert(localStr('lang_alert_title'), ret.msg);
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
    //还要判断盘点设备是否有设置了状态
    // let devices = this.state.rowData.assets || []
    // if (devices.find(d => {
    //   if (this.state.localDeviceState) {
    //     return !this.state.localDeviceState[d.assetId] && this.state.localDeviceState[d.assetId] !== 0
    //   } else {
    //     return !d.status && d.status !== 0
    //   }

    // })) {
    //   this.showToast('请为所有设备填写盘点结果')
    //   return;
    // }


    apiSubmitTicket({ id: this.state.rowData.id }).then(ret => {
      if (ret.code === CODE_OK) {
        this.props.ticketChanged && this.props.ticketChanged();
        // Alert.alert(localStr('lang_alert_title'), '工单提交后，状态为闲置和缺失的设备将被停用自动盘点的监测规则');
        this._loadTicketDetail();
        // //接口异步更新，重新获取详情可能状态还没变，这里手动更新状态
        // let rowData = this.state.rowData;
        // rowData.ticketState = STATE_PENDING_AUDIT;
        // this.setState({rowData})
        this.showToast("提交成功");
      } else {
        Alert.alert(localStr('lang_alert_title'), ret.msg);
      }
    })
  }

  _getButton(isScollView) {
    let status = this.state.rowData.ticketState;
    // status = STATE_NOT_START
    let logButton = (
      <TouchFeedback style={{}}
        onPress={() => {
          this._writeLog();
        }}>
        <View style={{ minWidth: 50, minHeight: 50, justifyContent: 'center', alignItems: 'center' }}>
          <Icon type='icon_ticket_log' size={16} color={'#333'} />
          <Text style={{ fontSize: 12, color: '#333', marginTop: 3 }}>{localStr('lang_ticket_detail_write_log')}</Text>
        </View>
      </TouchFeedback>
    );
    if ((this.state.isExecutor && status === STATE_NOT_START && privilegeHelper.hasAuth(CodeMap.TICKET_MANAGEMENT_FULL)) && !isScollView) {
      let btnLabel = localStr('lang_ticket_detail_begin_execute');
      //还需要判断是否是创建者和有工单执行权限
      return (
        <Bottom borderColor={'#f2f2f2'} height={54} backgroundColor={'#fff'}>
          <Button
            style={[styles.button, {
              borderWidth: 1, borderColor: '#888', display: 'none',
              backgroundColor: '#fff', marginLeft: 16, flex: 1, marginRight: 0
            }]}
            textStyle={{
              fontSize: 16,
              color: '#888'
            }}
            text={localStr('lang_ticket_detail_ignore')}
            onClick={() => this._doIgnore()} />
          <Button
            style={[styles.button, {
              backgroundColor: GREEN, marginLeft: 16, flex: 2, borderRadius: 8
            }]}
            textStyle={{
              fontSize: 16,
              color: '#ffffff'
            }}
            text={btnLabel} onClick={this._executeTicket} />
        </Bottom>
      );
    }

    if (status === STATE_PENDING_AUDIT && privilegeHelper.hasAuth(CodeMap.TICKET_ADULT_FULL)) {//表示已提交工单
      return this._renderSubmittedButton();
    }
    //执行中和已驳回操作一样
    if (this.state.isExecutor && (status === STATE_STARTING || status === STATE_REJECTED) && privilegeHelper.hasAuth(CodeMap.TICKET_MANAGEMENT_FULL) && !isScollView) {
      return (
        <Bottom borderColor={'#f2f2f2'} height={54} backgroundColor={'#fff'}>
          {/* <View style={{ flexDirection: 'row', flex: 1 }}>
            <View style={{ flex: 1 }}>
              {logButton}
            </View>
          </View> */}
          <View style={{ flex: 3, alignItems: 'center', marginHorizontal: 16, flexDirection: 'row', height: 34, borderRadius: 8, backgroundColor: GREEN, }}>
            <TouchableOpacity style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} onPress={this._addNewInventory}>
              <Text style={{ color: '#fff', fontSize: 14 }}>{'新增盘盈'}</Text>
            </TouchableOpacity>
            <View style={{ width: 1, height: 20, backgroundColor: '#64D975' }} />
            <TouchableOpacity style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} onPress={this._scanInventory}>
              <Text style={{ color: '#fff', fontSize: 14 }}>{'扫描盘点'}</Text>
            </TouchableOpacity>
            <View style={{ width: 1, height: 20, backgroundColor: '#64D975' }} />
            <TouchableOpacity style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} onPress={() => this._submitTicket()}>
              <Text style={{ color: '#fff', fontSize: 14 }}>{'提交审批'}</Text>
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
    this.props.navigator.push({
      id: 'device_add',
      component: DeviceAdd,
      passProps: {
        ticketId: this.state.rowData.id,
        objectId: this.state.rowData.objectId,
        objectType: this.state.rowData.objectType,
        onRefresh: () => {
          this._loadTicketDetail()
        }
      }
    })
  }

  //扫描盘点
  _scanInventory = () => {
    console.log('scan inventory')
    this.props.navigator.push({
      id: 'scan_device',
      component: Scan,
      passProps: {
        onRefresh: () => { },
        scanResult: (result, type) => {
          if (type == 'device') {
            let device = this.state.rowData.assets.find((item) => item.assetId === result.DeviceId);
            if (!device) {
              Alert.alert('该资产不在本次盘点范围内', null,
                [
                  {
                    text: '知道了', onPress: () => {
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
    Alert.alert(
      '',
      localStr('确定删除这个盘盈设备吗？'),
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
                Alert.alert(localStr('lang_alert_title'), res.msg);
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
        && (privilegeHelper.hasAuth(CodeMap.TICKET_EDIT_FULL))) {
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
                this.props.navigator.push({
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
                          Alert.alert(localStr('lang_alert_title'), ret.msg)
                        }
                      })
                    },
                    onBack: () => this.props.navigator.pop()
                  }
                })
              }
            }, {
              title: localStr('lang_ticket_detail_change_time'),
              click: () => {
                this.props.navigator.push({
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
                          Alert.alert(localStr('lang_alert_title'), res.msg)
                        }
                      })
                    },
                    onBack: () => this.props.navigator.pop()
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
        onIconClicked={() => {
          this.props.navigator.pop()
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
        Alert.alert("", data.msg || '设置状态失败！', [
          { text: '确定', onPress: () => { } }
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
        }
        this.setState({
          rowData: data.data,
          isCreateUser,
          rejectData,
          isFetching: false,
          isExecutor
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
    if (status !== STATE_REJECTED) return null;
    let reason = this.state.rejectData.content
    let RejectUser = this.state.rejectData.userName
    let rejectTime = moment(this.state.rejectData.createTime).format('YYYY-MM-DD HH:mm:ss');
    return (
      <View style={{ backgroundColor: '#fff', padding: 16, margin: 16, marginTop: 0, borderRadius: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 17, color: '#333', fontWeight: '500' }}>{localStr('lang_ticket_detail_reject_reason')}</Text>
        </View>
        <View style={{ height: 1, backgroundColor: '#f2f2f2', marginRight: -16, marginTop: 16, marginBottom: 12 }} />
        <Text style={{ fontSize: 17, color: '#333', lineHeight: 28 }}>{reason}</Text>
        <Text style={{ fontSize: 12, color: '#b2b2b2', marginTop: 10 }}>{`${RejectUser}  ${rejectTime}`}</Text>
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
    }, 1500);
  }



  _showInventoryMenu = (device) => {
    this.props.navigator.push({
      id: 'ticket_pd',
      component: ScanResult,
      passProps: {
        title: '',
        tid: this.state.rowData.id,
        device: device,
        callBack: () => {
          // this.props.navigator.pop();
          // this._loadTicketDetail();
        },
        onBack: () => this.props.navigator.pop()
      }
    })
    // this.setState({
    //   arrActions: DEVICE_STATUS.map(item => {
    //     return {
    //       title: item.name,
    //       click: () => {
    //         this._checkDeviceStatus(device, item.type)
    //       }
    //     }
    //   }),
    //   modalVisible: true
    // })
  }

  _renderInventoryDeviceList() {
    let status = this.state.rowData.ticketState;
    let arrStatus = new Array(5).fill(0);
    const devices = this.state.rowData.assets.map((item, index) => {
      let canCheck = this.state.isExecutor && (item.extensionProperties && item.extensionProperties.assetPointCheckState === 1) && privilegeHelper.hasAuth(CodeMap.TICKET_MANAGEMENT_FULL)
      let imgUrl = null;
      let defaultImg = require('./images/building_default/building.png');
      if (item.extensionProperties && item.extensionProperties?.assetLogo) {
        let jsonLogo = JSON.parse(item.extensionProperties.assetLogo);
        imgUrl = jsonLogo[0].key;
        // imgUrl = "668673300442906624";
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
          //style={{flex:1,backgroundColor:'transparent'}}
          key={String(index)}
          onLongPress={() => this._deleteDevice(item, index)}>
          <View key={index} style={{
            flexDirection: 'row', alignItems: 'center', marginTop: 10, borderTopColor: '#f5f5f5',
            borderTopWidth: 1, paddingTop: 10
          }}>
            <CacheImage borderWidth={1} space={10} key={imgUrl} imageKey={imgUrl} defaultImgPath={defaultImg} width={70} height={50} />
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={{ color: '#333', fontSize: 14 }}>{item.assetName}</Text>
              <Text style={{ color: '#666', fontSize: 12, marginTop: 8 }}>{`编号：${item.code || ''}`}</Text>
            </View>
            {
              this.state.rowData.ticketState === STATE_NOT_START ? null :
                <TouchableOpacity disabled={!canCheck} style={{ height: 50, width: 60, alignItems: 'center' }} onPress={() => this._showInventoryMenu(item)}>
                  {
                    // ((this.state.localDeviceState && !this.state.localDeviceState[item.assetId] && this.state.localDeviceState[item.assetId] !== 0)
                    // || (!item.status && item.status !== 0)) ?
                    (item.extensionProperties && item.extensionProperties.assetPointCheckState === 1) ?
                      <Text style={{ fontSize: 12, color: GREEN, marginTop: 8 }}>盘点</Text> :
                      <Image style={{ width: 60, height: 60 }} source={DEVICE_STATUS_ICON[item.extensionProperties?.assetPointCheckState]} />
                  }
                </TouchableOpacity>
            }
          </View>
        </TouchFeedback>

      )
    })
    arrStatus[0] = this.state.rowData.assets.length;
    return (
      <View style={{ margin: 16, marginTop: 0, borderRadius: 12, backgroundColor: '#fff', padding: 16 }}>
        {this._renderInventoryTabs(arrStatus)}
        {devices}
      </View>
    )
  }

  _renderInventoryTabs(arrStatus) {
    let tabs = [`全部(${arrStatus[0]})`, `未盘(${arrStatus[1]})`, `已盘(${arrStatus[2]})`, `盘亏(${arrStatus[3]})`, `盘盈(${arrStatus[4]})`];
    return (
      <View style={{ marginBottom: -10, flexDirection: 'row', justifyContent: 'space-between' }}>
        {
          tabs.map((item, index) => {
            let isSel = index === this.state.deviceTab;
            return (
              <TouchableOpacity onPress={() => this.setState({ deviceTab: index })}>
                <Text style={{ fontSize: 14, color: isSel ? GREEN : '#8C8C8C' }}>{item}</Text>
                <View style={{ height: 1, marginTop: 12, backgroundColor: isSel ? GREEN : undefined }} />
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
      { title: '盘盈资产自动新增入库', sel: false },
      { title: '未盘资产自动盘亏处理并创建清理报废单', sel: false },
      { title: '盘亏资产自动创建清理报废单', sel: false },
      { title: '标记为故障的资产自动创建报修单', sel: false },
      { title: '标记为待清理的资产自动创建清理报废单', sel: false },
    ]
  }

  _showSubmitDialog() {
    this.setState({
      submitModalVisible: true,
      submitMenus: this._makeMenus()
    })
  }

  _renderSubmitDialog() {
    if (!this.state.submitModalVisible) return;
    //icon 161
    let menus = this.state.submitMenus.map(m => {
      return (
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}
          onPress={() => {
            m.sel = !m.sel;
            this.setState({})
          }}
        >
          <View style={{
            width: 16, height: 16, justifyContent: 'center', alignItems: 'center', borderRadius: 2, borderWidth: 1,
            borderColor: '#d9d9d9', marginRight: 6
          }}>
            {!m.sel ? null :
              <Icon type={'icon_check'} color={'#595959'} size={14} />
            }
          </View>
          <Text style={{ fontSize: 14, color: '#595959' }}>{m.title}</Text>
        </TouchableOpacity>
      )
    })
    return (
      <CommonDialog modalVisible={this.state.submitModalVisible} title={'审批通过'}>
        <View style={{ padding: 16, borderRadius: 12, backgroundColor: '#fff', marginHorizontal: 32 }}>
          <Text style={{ fontSize: 17, color: '#1f1f1f', fontWeight: '600', alignSelf: 'center' }}>{'审批通过'}</Text>
          {menus}
          <View style={{
            borderTopColor: '#bfbfbf', flexDirection: 'row', height: 40, borderTopWidth: 1, marginHorizontal: -16,
            marginBottom: -16, marginTop: 16
          }}>
            <TouchableOpacity style={{ flex: 1, height: 40, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => this.setState({ submitModalVisible: false })}>
              <Text style={{ color: '#3491FA', fontSize: 17 }}>{'取消'}</Text>
            </TouchableOpacity>
            <View style={{ width: 1, backgroundColor: '#bfbfbf' }} />
            <TouchableOpacity style={{ flex: 1, height: 40, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => this._approveTicket()}>
              <Text style={{ color: '#3491FA', fontSize: 17 }}>{'确定'}</Text>
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
        <View style={{ flex: 1, backgroundColor: 'white' }}>
          {this._getToolbar(this.props.rowData)}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 17, color: GRAY }}>{this.state.errorMessage}</Text>
          </View>
        </View>
      )
    }
    if (this.state.isFetching || !this.state.rowData) {
      return (
        <View style={{ flex: 1, backgroundColor: 'white' }}>
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
          <View style={{ backgroundColor: '#fff' }}>
            <View style={{ marginBottom: (isPhoneX() ? 34 : 0) }}>
              {bottomButton}
            </View>
          </View>
        );
      } else {
        bottomButton = (
          <View style={{ marginBottom: (isPhoneX() ? 34 : 0) }}>
            {bottomButton}
          </View>
        );
      }
    }

    return (
      <View style={{ flex: 1, backgroundColor: LIST_BG }}>
        {this._getToolbar(this.state.rowData)}
        <ScrollView showsVerticalScrollIndicator={false} style={[styles.wrapper, marginBottom]}>
          <ViewShot style={{ flex: 1, backgroundColor: LIST_BG }} ref="viewShot" options={{ format: "jpg", quality: 0.9 }}>
            {/*{this._getAssetView()}*/}
            {this._renderRejection()}
            {this._renderInventoryTicketInfo()}
            {this._renderInventoryDeviceList()}
            {/* {this._renderRejection()} */}
            <View style={{ height: 1, backgroundColor: '#f2f2f2', marginLeft: 16 }} />
            {/*{this._getTaskView()}*/}
            <View style={{ height: 1, backgroundColor: '#f2f2f2', marginLeft: 16 }} />
            {/*{this._getDocumentsView()}*/}
            {/* {this._getLogMessage()} */}
            {this._getIDView()}
            <View style={{ height: 10, flex: 1, backgroundColor: LIST_BG }}>
            </View>
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
