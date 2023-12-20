'use strict'

import React, { Component } from 'react';

import {
  View,
  StyleSheet, Image, Pressable, Appearance,
} from 'react-native';

import Text from './components/Text';
import Icon from './components/Icon.js';
import { GRAY, BLACK, ALARM_RED } from './styles/color';
import moment from 'moment';
import TouchFeedback from "./components/TouchFeedback";
import { localStr } from "./utils/Localizations/localization";
import Colors from "../../../app/utils/const/Colors";

export default class TicketRow extends Component {
  constructor(props) {
    super(props);
  }

  _getDateDisplay() {
    return `${moment(this.props.rowData.startTime).format('YYYY-MM-DD')} ${localStr('lang_ticket_to')} ${moment(this.props.rowData.endTime).format('YYYY-MM-DD')}`;
  }

  _getContent() {
    var { rowData } = this.props;
    let status = rowData.TicketType;
    var content = rowData.Content || '';
    var strContent = '';
    content.split('\n').forEach((item) => {
      strContent += item;
      strContent += ' ';
    });
    return strContent;
  }

  _newText() {
    var { rowData } = this.props;
    var startTime = moment(rowData.StartTime).format('YYYY-MM-DD');
    var endTime = moment(rowData.EndTime).format('YYYY-MM-DD');
    var nowTime = moment().format('YYYY-MM-DD');
    var status = rowData.Status | rowData.TicketStatus;
    var isExpire = false;
    if (status === 1) {
      isExpire = startTime < nowTime;
    } else if (status === 2) {
      isExpire = endTime < nowTime;
    }
    if (isExpire) {
      return (
        <View style={styles.expireView}>
          <Icon type='icon_over_due' size={18} color={ALARM_RED} />
          <Text style={styles.expireText}>{localStr('lang_ticket_detail_status_expired')}</Text>
        </View>
      );
    }
    return null;
  }

  _getStatusInfo(rowData) {
    let status = {
      10: localStr('lang_status_1'),
      20: localStr('lang_status_2'),
      30: localStr('lang_status_3'),
      40: localStr('lang_status_4'),
      50: localStr('lang_status_5'),
      60: localStr('lang_status_6')
    }[rowData.ticketState];
    let ret = {
      label: status,
      textColor: '',
      bgColor: '',
      borderColor: '',
    };
    let isDarkMode = Appearance.getColorScheme() === 'dark';
    switch (rowData.ticketState) {
      case 10:
        ///未开始/待执行
        ret.textColor = isDarkMode ? '#ffffffd9' : '#1F1F1F';
        ret.borderColor = isDarkMode ? '#424242' : '#D9D9D9';
        ret.bgColor = isDarkMode ? '#ffffff0d':'#f8f8f8';
        break;
      case 20:
        ret.textColor = isDarkMode ? '#1C508A' :'#3491FA';
        ret.borderColor = isDarkMode ? '#1C508A' : '#9FD4FD';
        ret.bgColor = isDarkMode ? '#0F2F58': '#f8f8f8';
        break;
      case 30:
        ///已提交
        ret.textColor = isDarkMode ? '#D89614' : '#FAAD14';
        ret.borderColor = isDarkMode ? '#594214' : '#FFCF8B';
        ret.bgColor = isDarkMode ? '#2B2111' : '#f8f8f8';
        break;
      case 50:
        ///已完成
        ret.textColor = isDarkMode ? '#38B24F' : '#3DCD58';
        ret.borderColor = isDarkMode ? '#38B24F' : '#3DCD58';
        ret.bgColor = isDarkMode ? '#1C2B22' : '#F0FFF0';
        break;
      case 40:
        ///驳回
        ret.textColor = isDarkMode ? '#D32029' : '#F5222D';
        ret.borderColor = isDarkMode ? '#58181C' :'#FFA39E';
        ret.bgColor = isDarkMode ? '#2A1215' :'#FFF1F0';
        break;
    }
    return ret;
  }

  _renderTicketStatus(statusInfo) {
    return (
      <View style={{
        backgroundColor: statusInfo.bgColor,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: statusInfo.borderColor,
        paddingVertical: 4,
        paddingHorizontal: 6
      }}>
        <Text style={{ fontSize: 12, color: statusInfo.textColor }}>{statusInfo.label}</Text>
      </View>
    )
  }


  _configAssetCounts(status, rowData) {
    let count = 0;
    for (const asset of rowData.assets) {
      if (!asset.extensionProperties || !asset.extensionProperties.assetPointCheckState) {
        asset.extensionProperties = {
          ...asset.extensionProperties,
          assetPointCheckState: 1
        }
      }
      if (asset.extensionProperties && asset.extensionProperties.assetPointCheckState) {
        if (status === asset.extensionProperties.assetPointCheckState) {
          count++;
        }
      }
    }
    return count;
  }

  _renderInventoryItems(rowData) {
    let isDarkMode = Appearance.getColorScheme() === 'dark';

    let infos = [
      {
        title: '未盘',
        color: isDarkMode ? '#424242':'#D9D9D9',
        count: this._configAssetCounts(1, rowData)
      },
      {
        title: '已盘',
        color: isDarkMode ? '#424242': '#3DCD58',
        count: this._configAssetCounts(2, rowData)
      },
      {
        title: '盘亏',
        color: '#F53F3F',
        count: this._configAssetCounts(3, rowData)
      },
      {
        title: '盘盈',
        color: '#FAAD14',
        count: this._configAssetCounts(4, rowData)
      },
    ]
    return (
      <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
        {
          infos.map((item, index) => {
            return (
              <Pressable style={{
                flex: 1,
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingTop: 12,
                paddingBottom: 12,
                paddingRight: 8,
                backgroundColor: Colors.background.fill,
                borderRadius: 8,
                marginLeft: index > 0 ? 12 : 0,
              }} onPress={() => this.props.onInventoryItemClick(rowData, index + 1)}>
                <View style={{
                  backgroundColor: item.color,
                  borderTopRightRadius: 3,
                  width: 4,
                  height: 14,
                  borderBottomRightRadius: 2
                }} />
                <View style={{}}>
                  <Text style={{ fontSize: 13, color: Colors.text.sub }}>{item.title}</Text>
                  <Text style={{
                    fontSize: 22,
                    color: Colors.text.sub,
                    marginTop: 8,
                    fontWeight:'bold'
                  }}>{item.count}</Text>
                </View>
                <Image source={require('../app/images/login_arrow/arrow.png')} />
              </Pressable>
            )
          })
        }
      </View>
    )
  }

  render() {
    var { rowData } = this.props;
    var startTime = moment(rowData.startTime).format('YYYY-MM-DD');
    var endTime = moment(rowData.endTime).format('YYYY-MM-DD');
    var nowTime = moment().format('YYYY-MM-DD');
    var status = rowData.Status | rowData.TicketStatus;
    var isExpire = rowData.isExpired;

    let title = rowData.title;
    let locationPath = rowData?.locationInfo || '-';///rowData?.extensionProperties?.objectName || '-';
    // let locationPath = rowData.assets.map((item) => item.locationName).join('、');
    return (
      <TouchFeedback onPress={() => this.props.onRowClick(rowData)}>
        <View>
          <View style={{
            marginTop: 15,
            marginBottom: 10,
            borderRadius: 2,
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTopLeftRadius: 2,
              borderTopRightRadius: 2
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                <Text
                  style={{ color: Colors.text.primary, fontSize: 16, fontWeight: 'bold', flexShrink: 1, marginRight: 3 }}
                  numberOfLines={1}>{title}</Text>
              </View>
              {this._renderTicketStatus(this._getStatusInfo(rowData))}
            </View>
            <Text style={{ fontSize: 14, color: Colors.text.sub, marginTop: 10, }}>
              {localStr('lang_ticket_execute_time') + ': '}
              <Text style={{
                fontSize: 14,
                color: (isExpire ? '#ff4d4d' : Colors.text.primary),
              }}>{this._getDateDisplay()}</Text>
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
              <Text style={{ marginLeft: 0, color: Colors.text.sub, fontSize: 14 }} numberOfLines={1}
                lineBreakModel='charWrapping'>{localStr('lang_ticket_location') + ": " + locationPath}</Text>
            </View>
          </View>
          {this._renderInventoryItems(rowData)}
          <View style={{ backgroundColor: Colors.background.divider, height: 1, marginTop: 15 }} />
        </View>
      </TouchFeedback>
    );
  }

}

var styles = StyleSheet.create({
  rowHeight: {
    height: 78
  },
  row: {
    backgroundColor: 'transparent',
    padding: 16,
    // justifyContent:'space-between'
  },
  titleRow: {
    flexDirection: 'row',
    // backgroundColor:'red',
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleText: {
    color: BLACK,
    fontSize: 17
  },
  timeText: {
    color: GRAY,
    fontSize: 12,
    marginLeft: 6,
    marginTop: 3,
  },
  expireText: {
    color: ALARM_RED,
    fontSize: 12,
    marginLeft: 6,
    marginTop: 3,
  },
  expireView: {
    borderRadius: 1,
    flexDirection: 'row',
    // backgroundColor:'gray',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  contentRow: {
    flex: 1,
    marginTop: 8,
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  contentText: {
    color: GRAY,
    fontSize: 12
  },


});
