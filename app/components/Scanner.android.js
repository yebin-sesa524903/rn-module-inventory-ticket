'use strict';

import React, { Component } from 'react';
import {
  View, Text,
} from 'react-native';
import PropTypes from 'prop-types';
import ViewFinder from './ViewFinder.js';
import { RNCamera } from 'react-native-camera';
import { localStr } from '../utils/Localizations/localization.js'

export default class Scanner extends Component {
  constructor(props) {
    super(props);
    this.state = { zoom: 0 }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.openCamera !== this.props.openCamera) {
      if (nextProps.openCamera) {
        this.refs.rncamera.resumePreview && this.refs.rncamera.resumePreview();
      } else {
        this.refs.rncamera.pausePreview && this.refs.rncamera.pausePreview();
      }
    }
  }

  componentWillUnmount() {
    // console.warn('unmount Scanner');
  }
  render() {
    let Cmp = View;
    if (!this.props.hidden) {
      Cmp = RNCamera;
    }
    return (
      <Cmp ref={'rncamera'}
        style={{ flex: 1, }}
        zoom={this.props.zoom}
        flashMode={this.props.flashMode === 'on' ? RNCamera.Constants.FlashMode.torch : RNCamera.Constants.FlashMode.off}
        onBarCodeRead={this.props.onBarCodeRead}
      >
        <View style={{ flex: 1, backgroundColor: '#000000', opacity: 0.6, }}>

        </View>
        <View style={{ flexDirection: 'row', height: 200 }}>
          <View style={{ flex: 1, backgroundColor: '#000000', opacity: 0.6, }}>

          </View>
          <View style={{
            width: 200,
          }} >
            <ViewFinder />
          </View>
          <View style={{ flex: 1, backgroundColor: '#000000', opacity: 0.6, }}>

          </View>
        </View>

        <View style={{ flex: 1, backgroundColor: '#000000', opacity: 0.6, alignItems: 'center', paddingTop: 12 }}>
          <Text style={{ fontSize: 16, color: '#bfbfbf' }}>{localStr('lang_scan_tip')}</Text>
        </View>
      </Cmp>
    );
  }
}


Scanner.propTypes = {
  onBarCodeRead: PropTypes.func.isRequired,
  flashMode: PropTypes.string,
}
