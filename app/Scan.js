
'use strict';
import React, { Component } from 'react';
import {
  InteractionManager,
  Alert, View,
  PermissionsAndroid, Platform, TouchableOpacity, Image, Text
} from 'react-native';



import ScanView from './components/Scanner';

import Permissions, { PERMISSIONS, RESULTS, request, check } from 'react-native-permissions';
import ScanResult from "./ScanResult";


export default class Scan extends Component {

  constructor(props) {
    super(props);
    this.state = { openCamera: false, hasCameraAuth: false, modalShow: false, zoom: 0, flashMode: 'off' };
  }
  _getScanData(data) {
    this._clearZoom();

    //处理扫描结果，是跳转到页面还是提示错误


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
    this.props.navigator.pop();
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
              Alert.alert(
                '',
                '请在手机的' + '"' + '设置' + '"' + '中，允许当前应用访问您的摄像头',
                [
                  { text: '取消', onPress: () => { } },
                  {
                    text: '允许', onPress: () => {
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

      var navigator = this.props.navigator;
      if (navigator) {
        let callback = (event) => {
          if (event.data.route && event.data.route.id && event.data.route.id === this.props.route.id) {
            InteractionManager.runAfterInteractions(() => {
              this._mounted(true);
            })
          }
        };
        if (navigator.navigationContext && navigator.navigationContext.addListener)
          this._listener = navigator.navigationContext.addListener('willfocus', callback);

      }
    });
  }


  componentWillUnmount() {
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

  render() {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <ScanView
          isFetching={this.props.isFetching}
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
              this.props.navigator.pop()
            })
          }}
          barCodeComplete={(data) => this._getScanData(data)} />
        <View style={{ height: 160, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
          <TouchableOpacity onPress={() => this._didSwitchLight()}>
            <Image style={{ width: 56, height: 56 }} source={this.state.flashMode != 'on' ? require('./images/scan_light/light_on.png') : require('./images/scan_light/light_off.png')} />
          </TouchableOpacity>
          <Text style={{ color: '#595959', fontSize: 16, marginTop: 12 }}>{`${this.state.flashMode === 'on' ? '打开' : '关闭'}手电筒`}</Text>
        </View>
      </View>

    );
  }
}
