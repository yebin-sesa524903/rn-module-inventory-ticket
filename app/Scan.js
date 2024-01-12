
'use strict';
import React, { Component } from 'react';
import {
  InteractionManager,
  Alert, View,
  PermissionsAndroid, Platform, TouchableOpacity, Image, Text
} from 'react-native';
import { getLanguage, localStr } from "./utils/Localizations/localization";


import ScanView from './components/Scanner';

import Permissions, { PERMISSIONS, RESULTS, request, check } from 'react-native-permissions';
import ScanResult from "./ScanResult";
import { openCamera } from 'react-native-image-crop-picker';
import SndAlert from "../../../app/utils/components/SndAlert";
import Colors, {isDarkMode} from "../../../app/utils/const/Colors";


export default class Scan extends Component {

  constructor(props) {
    super(props);
    this.state = { openCamera: false, hasCameraAuth: false, modalShow: false, zoom: 0, flashMode: 'off' };
  }
  _getScanData(data) {
    this._clearZoom();
    console.warn('scan result', data);
    if (!this.state.openCamera) return;//如果状态不对，不处理
    //处理扫描结果，是跳转到页面还是提示错误
    //如果两次扫描结果一样，增加延迟处理
    if (data === this._preData) {
      let lastTime = this._lastTime || 0;
      //相同结果，两次扫描结果1秒内，不重复处理
      if (Date.now() - lastTime < 1000) return;
      this._lastTime = Date.now();
    } else {
      this._preData = data;
      this._lastTime = Date.now();
    }

    try {
      let dataLower = data.toLowerCase();
      if (dataLower.indexOf('.energymost.com') !== -1 &&
        dataLower.indexOf('.energymost.com/download-app/sn=') === -1) {
        // this.props.updateSpHttpInfo({type:'scan',data});
        this.setState({ openCamera: false });
        Linking.canOpenURL(data).then(async (supported) => {
          if (supported) {
            // this.props.updateSpHttpInfo({ type: 'scan', data });
          } else {
            throw new Error();
          }
        });

        return;
      }
      // this.props.updateEntry({ isFromPanelAdd: !!this.props.isFromPanelAdd });
      data = JSON.parse(data);
      if ('PanelId' in data) {
        this.setState({ openCamera: false, panelId: data.PanelId });
        if (data.PanelId) {
          // this.props.loadPanelHierarchy(data.PanelId);
        }
      } else if ('RoomId' in data) {
        this.setState({ openCamera: false, panelId: data.RoomId });
        if (data.RoomId) {
          // this.props.loadRoomHierarchy(data.RoomId);
        }
      } else if ('DeviceId' in data) {
        this.setState({ openCamera: false, deviceId: data.DeviceId });
        if (data.DeviceId) {
          this.props.scanResult(data, 'device', () => this.setState({ openCamera: true }));
          // this.props.updateScanDeviceData({ DeviceId: data.DeviceId, DeviceName: data.DeviceName });
        }
      } else {
        this.setState({ openCamera: false });
        SndAlert.alert(localStr("lang_scan_page_alert_error_title"), localStr('lang_scan_page_alert_error_content'),
          [
            {
              text: localStr('lang_scan_page_alert_error_button'), onPress: () => {
                this.setState({ openCamera: true });
                return;
              }
            }
          ]
        )
        // this.props.scanResult(data);
        // throw new Error();
      }
    } catch (e) {
      this.setState({ openCamera: false });
      // if (this.props.isBindQRCode || this.props.isFromPanelAdd) {
      //   this.strQrcode = data;
      // }
      // this.props.loadAssetWithQrcode(data, this.props.isFromPanelAdd, this.props.isBindQRCode);
    }
  }

  _mounted(v, cb = () => { }) {
    this.setState({ openCamera: v }, cb);
    if (v) {
      this._delayZoom();
    } else {
      this._clearZoom();
    }
  }
  _onBackClick() {
    this.props.navigation.pop();
  }

  _delayZoom() {
    this._clearZoom();
    this._zoomTimer = setTimeout(() => {
      this.setState({ zoom: Platform.OS === 'ios' ? 0.07 : 0.2 })
    }, 5000);
  }

  _clearZoom() {
    clearTimeout(this._zoomTimer);
    this._zoomTimer = null;
  }

  componentDidMount() {
    // console.warn('scan load')
    // setTimeout(() => {
    //   this._getScanData('{"DeviceId":192,"DeviceName":"制冰机"}');
    // }, 1000);

    InteractionManager.runAfterInteractions(() => {
      let cameraPermission = Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;
      check(cameraPermission).then(response => {
        if (response === RESULTS.GRANTED || response === RESULTS.LIMITED) {
          this._mounted(true);
          this.setState({ hasCameraAuth: true });
        } else if (response === RESULTS.BLOCKED || response === RESULTS.DENIED) {
          request(cameraPermission).then(response => {
            if (response === RESULTS.GRANTED || response === RESULTS.LIMITED) {
              this._mounted(true);
              this.setState({ hasCameraAuth: true });
            } else {
              this.setState({ hasCameraAuth: false });
              SndAlert.alert(
                localStr('lang_image_picker_accept_msg'),
                '',
                [
                  { text: localStr('lang_image_picker_cancel'), onPress: () => { } },
                  {
                    text: localStr('lang_image_picker_accept'), onPress: () => {
                      if (Permissions.openSettings()) {
                        Permissions.openSettings();
                      }
                    }
                  }
                ],
                { cancelable: false }
              )
              this._mounted(false);
            }
          })
        }
      });
      let that = this;
      var navigation = this.props.navigation;
      if (navigation) {
        let callback = (event) => {
          if (event.data.route && event.data.route.id && event.data.route.id === this.props.route.id) {
            InteractionManager.runAfterInteractions(() => {
              this._mounted(true, () => this.setState({ hidden: false }));
            })
          }
          if (event.data.route && event.data.route.id && event.data.route.id !== this.props.route.id) {
            //导航切换到其他页面，关闭
            InteractionManager.runAfterInteractions(() => {
              that.setState({
                openCamera: false, flashMode: 'off', hidden: true,
              })
            })
          }
        };
        if (navigation.navigationContext && navigation.navigationContext.addListener)
          this._listener = navigation.navigationContext.addListener('willfocus', callback);

      }
    });
  }


  componentWillUnmount() {
    this._lastTime = null;
    this._preData = null;
    this._listener && this._listener.remove();
    this._clearZoom();
  }

  _didSwitchLight = () => {
    let flash = this.state.flashMode;
    let modeString = '';
    if (flash === 'off') {
      modeString = 'on';
    } else {
      modeString = 'off';
    }
    this.setState({
      flashMode: modeString,
    })
  }

  _getLightText(flashMode) {
    let lan = getLanguage();
    //{`${this.state.flashMode === 'on' ? localStr('lang_scan_page_light_off') : localStr('lang_scan_page_light_on')}${localStr('lang_scan_page_light')}`}</Text>
    if(lan === 'en')
      return `${localStr('lang_scan_page_light')} ${this.state.flashMode === 'on' ? localStr('lang_scan_page_light_off') : localStr('lang_scan_page_light_on')}`
    return `${this.state.flashMode === 'on' ? localStr('lang_scan_page_light_off') : localStr('lang_scan_page_light_on')}${localStr('lang_scan_page_light')} `
  }

  _getLightIcon (){
    if (isDarkMode()){
      return this.state.flashMode === 'on' ? require('./images/scan_light/light_on_dark.png') : require('./images/scan_light/light_off_dark.png')
    }else {
      return this.state.flashMode === 'on' ? require('./images/scan_light/light_on_light.png') : require('./images/scan_light/light_off_light.png')
    }
  }

  render() {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <ScanView
          isFetching={this.props.isFetching}
          hidden={this.state.hidden}
          hasCameraAuth={this.state.hasCameraAuth}
          openCamera={this.state.openCamera}
          scanText={this.props.scanText}
          scanTitle={this.props.scanTitle}
          isFromPanelAdd={this.props.isFromPanelAdd}
          modalShow={this.state.modalShow}
          zoom={this.state.zoom}
          flashMode={this.state.flashMode}
          onOncancelInputDialog={() => {
          }}
          onConfirmInputDialog={(name) => {
          }}
          onBack={() => {
            this._mounted(false, () => {
              this.props.navigation.pop()
            })
          }}
          onBarCodeRead={(data) => this._getScanData(data?.data)} />
        <View style={{ height: 160, backgroundColor: Colors.seBgContainer, alignItems: 'center', justifyContent: 'center' }}>
          <TouchableOpacity onPress={() => this._didSwitchLight()}>
            <Image style={{ width: 56, height: 56,}} source={this._getLightIcon()}/>
          </TouchableOpacity>
          <Text style={{ color: Colors.seTextPrimary, fontSize: 16, marginTop: 12 }}>
            {this._getLightText(this.state.flashMode)}
          </Text>
        </View>
        <TouchableOpacity style={{ position: 'absolute', left: 22, top: 44 }}
          onPress={() => this.props.navigation.pop()}
        >
          <Image source={require('./images/close/close.png')} style={{ width: 28, height: 28, }} />
        </TouchableOpacity>
      </View>

    );
  }
}
