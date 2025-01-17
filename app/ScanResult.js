'use strict'

import React, { Component } from 'react';

import {
  View, Text,
  StyleSheet, Image, TouchableOpacity, Platform, TextInput, InteractionManager, Alert,
} from 'react-native';

import Toolbar from "./components/Toolbar";
import { GRAY, GREEN } from "./styles/color";
import { localStr } from "./utils/Localizations/localization";
import { isPhoneX } from "./utils";
import SchActionSheet from "./components/actionsheet/SchActionSheet";
import CacheImage from "./CacheImage";
import {
  apiLoadDevicePointCheckStatus,
  apiSubmitPointCheckResult,
  userId,
  userName,
  apiUpdateDevicePointCheckStatus, customerId, apiCheckDeviceStatus,
} from "./middleware/bff";
import { forEach } from 'lodash';
// import { Toast } from '@ant-design/react-native';
import Toast from 'react-native-root-toast';
const StatusColors = ['#3DCD58', '#F53F3F', '#1F1F1F', '#3491FA', '#FAAD14', '#F53F3F', 'red']
const StatusTags = [
  localStr('lang_scan_result_page_status_tag1'),
  localStr('lang_scan_result_page_status_tag2'),
  localStr('lang_scan_result_page_status_tag3'),
  localStr('lang_scan_result_page_status_tag4'),
  localStr('lang_scan_result_page_status_tag5'),
  localStr('lang_scan_result_page_status_tag6'),
  localStr('lang_scan_result_page_status_tag7'),
];

export default class extends Component {
  constructor(props) {
    super(props);
    //这里根据device进行初始化
    let info = props.device.extensionProperties;
    let inventoryType = 1;
    let tags = [{ tag: localStr('lang_scan_result_page_tag1'), sel: false }, { tag: localStr('lang_scan_result_page_tag2'), sel: false }];
    let remark = '';
    let imgUrl = null;
    if (info) {
      if (info.assetPointCheckState === 3) {
        inventoryType = 2;
      }
      if (info.assetRemark) remark = info.assetRemark;
      if (Array.isArray(info.assetTags) && info.assetTags.length > 0) {
        tags.forEach(tag => {
          if (info.assetTags.includes(tag.tag)) tag.sel = true;
        })
      }

      if (info?.assetLogo) {
        try {
          let jsonLogo = JSON.parse(info.assetLogo);
          if (jsonLogo) {
            imgUrl = jsonLogo[0].key;
          } else {
            imgUrl = info?.assetLogo;
          }
        } catch (e) { }
      }
    }
    console.log('imgurl', imgUrl);
    this.state = {
      tags, remark, inventoryType, statusType: 0, deviceStatus: 0, isRequestStatus: true, imgUrl,
    }
  }

  componentDidMount() {
    InteractionManager.runAfterInteractions(() => {
      this._loadDeviceStatus();
    })

  }
  _loadDeviceStatus = () => {
    //这里转换提交参数格式
    let data = {
      "deviceId": this.props.device.assetId,
    }
    apiLoadDevicePointCheckStatus(data).then(data => {
      if (data.code === '0') {
        data.data.forEach((item, index) => {
          if (item.deviceId === this.props.device.assetId) {
            this.setState({ deviceStatus: item.deviceStatus, isRequestStatus: false })
          }
        });
      } else {

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
        // Toast.show(localStr('lang_scan_result_submit_error_tip'), {
        //   duration: 1000,
        //   position: -80,
        // });
      } else {
        //给出提示
        Alert.alert("", data.msg || localStr('lang_ticket_detail_set_status_error'), [
          { text: localStr('lang_ticket_filter_ok'), onPress: () => { } }
        ]);
      }
    })
  }

  _submitResult = () => {
    let arrTags = [];
    this.state.tags.map(item => {
      if (item.sel === true) {
        arrTags.push(item.tag);
      }
    })
    ///修改设备状态
    this._checkDeviceStatus(this.props.device, this.state.inventoryType === 2 ? 1 : 0);

    //这里转换提交参数格式
    let data = {
      "id": this.props.tid,
      "assetId": this.props.device.assetId,
      "assetPointCheckState": this.state.inventoryType === 1 ? 2 : 3,
      "assetRemark": this.state.remark,
      "assetTags": this.state.inventoryType === 1 ? arrTags : [],
      "userId": userId,
      "userName": userName,
    }
    apiSubmitPointCheckResult(data).then(data => {
      if (data.code === '0' && data.data === true) {
        this.props.onRefresh && this.props.onRefresh();
        // console.warn('----', data);
        Toast.show(localStr('lang_scan_result_submit_success_tip'), {
          duration: 1000,
          position: -80,
        });
        this.props.navigator.pop()
      } else {
        Toast.show(localStr('lang_scan_result_submit_error_tip'), {
          duration: 1000,
          position: -80,
        });
      }
    })
  }
  _renderResult() {
    return (
      <View style={{ backgroundColor: '#fff', borderRadius: 12, margin: 16, padding: 16 }}>
        <View style={{ borderBottomColor: '#F0F0F0', borderBottomWidth: 1, paddingBottom: 16 }}>
          <Text style={{ color: '#1F1F1F', fontSize: 15, fontWeight: '500' }}>{localStr('lang_scan_result_label1')}</Text>
        </View>

        <View style={{
          flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomColor: '#F0F0F0',
          borderBottomWidth: 1
        }}>
          <Text style={{ color: '#595959', fontSize: 15 }}>
            {localStr('lang_scan_result_label1')}
          </Text>
          <View style={{ flex: 1 }} />
          {this._renderRadio(localStr('lang_scan_result_label2'), this.state.inventoryType === 1, () => this.setState({ inventoryType: 1, statusType: 0 }))}
          {this._renderRadio(localStr('lang_scan_result_label3'), this.state.inventoryType === 2, () => this.setState({ inventoryType: 2, statusType: 4 }))}
        </View>
        {this.state.inventoryType === 1 && (<View style={{
          flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomColor: '#F0F0F0',
          borderBottomWidth: 1
        }}>
          <Text style={{ color: '#595959', fontSize: 15 }}>
            {localStr('lang_scan_result_label4')}
          </Text>
          <Text style={{ color: '#BFBFBF', fontSize: 15 }}>
            {localStr('lang_scan_result_label5')}
          </Text>
          <View style={{ flex: 1 }} />
          {this.state.tags.map(item => this._renderTag(item))}
        </View>)}
        <TextInput
          style={{ fontSize: 15, lineHeight: 23, color: '#1f1f1f', paddingVertical: 6, marginTop: 10 }}
          underlineColorAndroid={'transparent'}
          textAlign={'left'}
          multiline={true}
          placeholderTextColor={'#BFBFBF'}
          textAlignVertical={'top'}
          placeholder={localStr('lang_scan_result_label6')}
          onChangeText={(text) => this.setState({ remark: text })}
          value={this.state.remark} />
      </View>
    )
  }

  _renderRadio(name, sel, cb) {
    return (
      <TouchableOpacity style={{ marginLeft: 12, flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }} onPress={cb}>
        <View style={{ width: 16, height: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: sel ? GREEN : '#D9D9D9' }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: sel ? GREEN : '#fff' }} />
        </View>
        <Text style={{ fontSize: 15, color: '#1f1f1f', marginLeft: 6 }}>{name}</Text>
      </TouchableOpacity>
    )
  }

  _renderTag(item) {
    let bg = item.sel ? '#F0FFF0' : '#F5F5F5';
    let fg = item.sel ? GREEN : '#595959';
    return (
      <TouchableOpacity key={item.tag} onPress={() => {
        item.sel = !item.sel
        this.setState({})
      }}
        style={{ marginLeft: 10, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4, backgroundColor: bg }}>
        <Text style={{ color: fg, fontSize: 15 }}>{item.tag}</Text>
      </TouchableOpacity>
    )
  }

  _showStatusTagsDialog = () => {
    this.setState({
      modalVisible: true,
      statusTags: StatusTags.slice(0, 4).map((tag, index) => {
        return {
          title: tag,
          click: () => this.setState({
            modalVisible: false,
            statusType: index
          })
        }
      })
    })
  }

  _renderStatusTag() {
    let color = 'gray';
    let tag = localStr('lang_scan_result_label7');
    if (!this.state.isRequestStatus) {
      tag = StatusTags[this.state.deviceStatus];
      color = StatusColors[this.state.deviceStatus];
    }
    return (
      <TouchableOpacity disabled={true || this.state.statusType === 4} onPress={this._showStatusTagsDialog}>
        <View style={{
          borderRadius: 2, paddingHorizontal: 6, marginLeft: 6,
          borderWidth: 1, borderColor: color, paddingVertical: 2, justifyContent: 'center', alignItems: 'center'
        }}>
          <Text style={{ color, fontSize: 12 }}>{tag}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  _renderActionSheet() {
    let arrActions = this.state.statusTags;
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
          }}>
        </SchActionSheet>
      )
    }
  }

  render() {
    let assetCode = '';
    if (this.props.device && this.props.device.extensionProperties && this.props.device.extensionProperties.assetCode) {
      assetCode = this.props.device.extensionProperties.assetCode;
    }
    return (
      <View style={{ flex: 1, backgroundColor: '#F4F6F8' }}>
        <Toolbar
          title={localStr('lang_scan_result_label8')}
          navIcon="back"
          onIconClicked={() => {
            this.props.navigator.pop()
          }}
          actions={[]}
          onActionSelected={[]}
        />
        <View style={{
          flexDirection: 'row', alignItems: 'center', marginTop: 10, marginHorizontal: 16, borderTopColor: '#f5f5f5',
          borderTopWidth: 1, paddingTop: 10, backgroundColor: '#fff', borderRadius: 12, margin: 16, padding: 16, marginBottom: 0,
        }}>
          <CacheImage borderWidth={1} imageKey={this.state.imgUrl} defaultImgPath={require('./images/building_default/building.png')} width={70} height={50} />
          <View style={{ marginLeft: 16, flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#333', fontSize: 14, flex: 1 }}>{this.props.device.assetName}</Text>
              {this._renderStatusTag()}
            </View>

            <Text style={{ color: '#666', fontSize: 12, marginTop: 8 }}>{`${localStr("lang_scan_result_label10")}：${assetCode}`}</Text>
          </View>
        </View>
        {this._renderResult()}
        <View style={{ backgroundColor: '#fff', position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, paddingTop: 12, paddingBottom: isPhoneX() ? 32 : 16, }}>
          <TouchableOpacity style={{
            height: 40,
            backgroundColor: GREEN, borderRadius: 8, alignItems: 'center', justifyContent: 'center'
          }} onPress={this._submitResult}>
            <Text style={{ fontSize: 17, color: '#fff' }}>{localStr('lang_scan_result_label9')}</Text>
          </TouchableOpacity>
        </View>

        {this._renderActionSheet()}
      </View>
    )
  }

}

