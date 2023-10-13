'use strict'

import React, { Component } from 'react';

import {
  View, Text,
  StyleSheet, Image, TouchableOpacity, Platform, TextInput, InteractionManager,
} from 'react-native';

import Toolbar from "./components/Toolbar";
import { GRAY, GREEN } from "./styles/color";
import { localStr } from "./utils/Localizations/localization";
import { isPhoneX } from "./utils";
import SchActionSheet from "./components/actionsheet/SchActionSheet";
import {
  apiLoadDevicePointCheckStatus,
  apiSubmitPointCheckResult,
  userId,
  userName,

} from "./middleware/bff";
import { forEach } from 'lodash';
// import { Toast } from '@ant-design/react-native';
import Toast from 'react-native-root-toast';

const StatusColors = ['#3DCD58', '#F53F3F', '#1F1F1F', '#3491FA', '#FAAD14', '#F53F3F', 'red']
const StatusTags = ['在用', '缺失', '闲置', '调拨中', '维修中', '报废', '清理中'];

export default class extends Component {
  constructor(props) {
    super(props);
    //这里根据device进行初始化
    let info = props.device.extensionProperties;
    let inventoryType = 1;
    let tags = [{ tag: '故障资产', sel: false }, { tag: '待清理资产', sel: false }];
    let remark = '';
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
    }
    this.state = {
      tags, remark, inventoryType, statusType: 0, deviceStatus: 0, isRequestStatus: true,
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
  _submitResult = () => {
    // let arrTags = this.state.tags.map(item => {
    //   if (item.sel === true) {
    //     return item.tag;
    //   } else
    //     return;
    // })
    let arrTags = [];
    this.state.tags.map(item => {
      if (item.sel === true) {
        arrTags.push(item.tag);
      }
    })
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
        Toast.show('盘点结果提交成功！', {
          duration: 1000,
          position: -80,
        });
        this.props.navigator.pop()
      } else {
        Toast.show('盘点失败，请检查参数！', {
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
          <Text style={{ color: '#1F1F1F', fontSize: 15, fontWeight: '500' }}>盘点结果</Text>
        </View>

        <View style={{
          flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomColor: '#F0F0F0',
          borderBottomWidth: 1
        }}>
          <Text style={{ color: '#1F1F1F', fontSize: 15 }}>
            {'盘点结果'}
          </Text>
          <View style={{ flex: 1 }} />
          {this._renderRadio('已盘', this.state.inventoryType === 1, () => this.setState({ inventoryType: 1, statusType: 0 }))}
          {this._renderRadio('盘亏', this.state.inventoryType === 2, () => this.setState({ inventoryType: 2, statusType: 4 }))}
        </View>
        {this.state.inventoryType === 1 && (<View style={{
          flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomColor: '#F0F0F0',
          borderBottomWidth: 1
        }}>
          <Text style={{ color: '#1F1F1F', fontSize: 15 }}>
            {'标签'}
          </Text>
          <Text style={{ color: '#BFBFBF', fontSize: 15 }}>
            {'(选填)'}
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
          placeholder={'请输入备注（选填）'}
          onChangeText={(text) => this.setState({ remark: text })}
          value={this.state.remark} />
      </View>
    )
  }

  _renderRadio(name, sel, cb) {
    return (
      <TouchableOpacity style={{ marginLeft: 12, flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }} onPress={cb}>
        <View style={{ width: 16, height: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: sel ? GREEN : '#D9D9D9' }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: sel ? GREEN : undefined }} />
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
    let tag = '查询中';
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
          title={'盘点结果'}
          navIcon="back"
          onIconClicked={() => {
            this.props.navigator.pop()
          }}
          actions={[]}
          onActionSelected={[]}
        />
        <View style={{
          flexDirection: 'row', alignItems: 'center', marginTop: 10, marginHorizontal: 16, borderTopColor: '#f5f5f5',
          borderTopWidth: 1, paddingTop: 10
        }}>
          <Image resizeMode={'cover'} style={{ width: 70, height: 50, borderRadius: 8, backgroundColor: '#f5f5f5' }}
            defaultSource={require('./images/building_default/building.png')}
            source={''} />
          <View style={{ marginLeft: 16, flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#333', fontSize: 14, flex: 1 }}>{this.props.device.assetName}</Text>
              {this._renderStatusTag()}
            </View>

            <Text style={{ color: '#666', fontSize: 12, marginTop: 8 }}>{`编号：${assetCode}`}</Text>
          </View>
        </View>
        {this._renderResult()}
        <TouchableOpacity style={{
          position: 'absolute', left: 16, right: 16, bottom: isPhoneX() ? 32 : 16, height: 44,
          backgroundColor: GREEN, borderRadius: 8, alignItems: 'center', justifyContent: 'center'
        }} onPress={this._submitResult}>
          <Text style={{ fontSize: 17, color: '#fff' }}>{'确认盘点'}</Text>
        </TouchableOpacity>
        {this._renderActionSheet()}
      </View>
    )
  }

}

