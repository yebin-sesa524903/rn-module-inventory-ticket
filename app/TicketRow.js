'use strict'

import React, { Component } from 'react';

import {
  View,
  StyleSheet, Image, Pressable, Appearance,
} from 'react-native';

import Text from './components/Text';
import { GRAY, BLACK, ALARM_RED } from './styles/color';
import moment from 'moment';
import TouchFeedback from "./components/TouchFeedback";
import { localStr } from "./utils/Localizations/localization";
import Colors from "../../../app/utils/const/Colors";
import {Icon} from "@ant-design/react-native";

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
    switch (rowData.ticketState) {
      case 10:
        ///未开始/待执行
        ret.textColor = Colors.seTextTitle;
        ret.borderColor = Colors.seBorderBase;
        ret.bgColor = Colors.seFill3;
        break;
      case 20:
        ///执行中
        ret.textColor = Colors.seInfoNormal;
        ret.borderColor = Colors.seInfoBorder;
        ret.bgColor = Colors.seInfoBg;
        break;
      case 30:
        ///已提交
        ret.textColor = Colors.seWarningNormal
        ret.borderColor = Colors.seWarningBorder;
        ret.bgColor = Colors.seWarningBg;
        break;
      case 50:
        ///已完成
        ret.textColor = Colors.seBrandNomarl
        ret.borderColor = Colors.seBrandNomarl;
        ret.bgColor = Colors.seBrandBg;
        break;
      case 40:
        ///驳回
        ret.textColor = Colors.seErrorNormal;
        ret.borderColor = Colors.seErrorBorder;
        ret.bgColor = Colors.seErrorBg;
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
        height: 22,
        justifyContent:'center',
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
        title: localStr('lang_ticket_detail_device_tab2'),
        color: Colors.seBorderBase,
        count: this._configAssetCounts(1, rowData)
      },
      {
        title: localStr('lang_ticket_detail_device_tab3'),
        color: Colors.seSuccessNormal,
        count: this._configAssetCounts(2, rowData)
      },
      {
        title: localStr('lang_ticket_detail_device_tab4'),
        color: Colors.seErrorNormal,
        count: this._configAssetCounts(3, rowData)
      },
      {
        title: localStr('lang_ticket_detail_device_tab5'),
        color: Colors.seWarningNormal,
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
                backgroundColor: Colors.seFill4,
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
                  <Text style={{ fontSize: 10, color: Colors.seTextPrimary }}>{item.title}</Text>
                  <Text style={{
                    fontSize: 22,
                    color: Colors.seTextPrimary,
                    marginTop: 8,
                    fontWeight:'bold'
                  }}>{item.count}</Text>
                </View>
                <Icon name={'right-square'} color={Colors.seTextSecondary} size={16}/>
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
                  style={{ color: Colors.seTextTitle, fontSize: 16, fontWeight: 'bold', flexShrink: 1, marginRight: 3 }}
                  numberOfLines={1}>{title}</Text>
              </View>
              {this._renderTicketStatus(this._getStatusInfo(rowData))}
            </View>
            <Text style={{ fontSize: 14, color: Colors.seTextPrimary, marginTop: 10, }}>
              {localStr('lang_ticket_execute_time') + ': '}
              <Text style={{
                fontSize: 14,
                color: (isExpire ? Colors.seErrorNormal : Colors.seTextPrimary),
              }}>{this._getDateDisplay()}</Text>
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
              <Text style={{ marginLeft: 0, color: Colors.seTextPrimary, fontSize: 14 }} numberOfLines={1}
                lineBreakModel='charWrapping'>{localStr('lang_ticket_location') + ": " + locationPath}</Text>
            </View>
          </View>
          {this._renderInventoryItems(rowData)}
          <View style={{ backgroundColor: Colors.seBorderSplit, height: 1, marginTop: 15 }} />
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
