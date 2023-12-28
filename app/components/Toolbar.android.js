'use strict';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { View, StyleSheet, Image, ViewPropTypes, Pressable, StatusBar } from 'react-native';
import { GREEN, IOS_NAVBAR, LINE, LIGHTGRAY } from '../styles/color.js';
import Text from './Text.js';
import TouchFeedback from './TouchFeedback';
import privilegeHelper from '../utils/privilegeHelper.js';
import Icon from './Icon';
import {Icon as AntIcon} from '@ant-design/react-native';
import Colors from "../../../../app/utils/const/Colors";

const height = 56 + StatusBar.currentHeight;//80;
const statusBarHeight = StatusBar.currentHeight;//24;
const sideWidth = 38;
const navHeight = 56;

export default class Toolbar extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    let { navIcon, onIconClicked, tintColor, color, borderColor, title, titleColor, actions } = this.props;
    let navView = null;
    let width = 20;
    let navImage = null;
    if (navIcon === 'back') {
      navImage = require('../images/back_arrow/back_arrow.png');
    }
    else if (navIcon === 'close') {
      navImage = require('../images/close/close.png');
    }else if(navIcon === 'icon'){
      navImage = 'icon';
    }
    let marginLeft = 0;

    if (navImage) {
      navView = (
          <TouchFeedback style={{}} onPress={onIconClicked}>
            <View style={{ paddingHorizontal: 16, height: navHeight, marginLeft, justifyContent: 'center', }}>
              {
                navIcon === 'icon' ?
                    <AntIcon name={'left-square'} color={Colors.white} size={22}/> :
                    <Image style={{ tintColor: titleColor ? tintColor : '#fff' }} source={navImage} />
              }
            </View>
          </TouchFeedback>
      );
    }
    else {
      navView = (
          <View style={{ marginLeft: 16, height: navHeight }}>
          </View>
      );
    }
    let actionsView = null;
    if (actions) {
      actions = actions.filter((item) => {
        if (!item.code) return true;
        // console.warn('item.code',item.code);
        if (privilegeHelper.hasAuth(item.code)) return true;
        return false;
      });
      actionsView = actions.map((item, index) => {
        // console.warn('actions.map((item,index)=>{',item);
        var imageOrText = null;
        var enabled = !item.disable;
        if (item.iconType || item.icon) {
          if (item.iconType === 'add') {
            item.icon = require('../images/add/add.png');
          }
          else if (item.iconType === 'edit') {
            item.icon = require('../images/edit/edit.png');
          }
          else if (item.iconType === 'delete') {
            item.icon = require('../images/delete/delete.png');
          } else if (item.iconType === 'filter') {
            item.icon = require('../images/filter/filter.png');
          } else if (item.iconType === 'share') {
            item.icon = require('../images/share/screen_share.png');
          }
          imageOrText = (
              <Image style={{ tintColor: '#fff', width: 18, height: 18 }} source={item.icon} />
          );
        } else if (item.isFontIcon) {
          imageOrText = <Icon type={item.type} color={enabled ? Colors.seTextInverse : Colors.seTextPrimary} size={16} />
        }
        else {
          width = null;
          imageOrText = (
              <Text style={{ color: enabled ? Colors.seTextInverse : Colors.seTextPrimary, fontSize: 15, textAlign: 'right', marginRight: 8 }}>{item.title}</Text>
          );
        }
        if (!enabled) {
          return (
              <View key={index} style={{
                paddingHorizontal: 8, height: navHeight,
                justifyContent: 'center', alignItems: 'center'
              }}>
                {imageOrText}
              </View>
          )
        } else {
          return (
              <Pressable key={index} style={{}} onPress={() => {
                if (enabled) {
                  this.props.onActionSelected[index](item);
                }
              }}>
                <View key={index} style={{
                  paddingHorizontal: 8, height: navHeight,
                  justifyContent: 'center', alignItems: 'center'
                }}>
                  {imageOrText}
                </View>
              </Pressable>
          );
        }
      });
    }
    else {
      actionsView = (
          <View style={{ width: sideWidth }}>
          </View>
      );
    }

    let titleStyle = [styles.titleText];
    if (titleColor) {
      titleStyle.push({ color: titleColor });
    } else {
      titleStyle.push({ color: Colors.seTextInverse });
    }

    if (color === 'transparent') {
      borderColor = 'transparent';
    } else {
      // color='#fff';
      color = Colors.seBrandNomarl;
      if (!borderColor){
        borderColor = Colors.seBrandNomarl;
      }
    }

    return (
        <View style={[styles.navSty, { backgroundColor: color, borderColor: borderColor }]}>
          <StatusBar barStyle={'light-content'} backgroundColor={Colors.seBrandNomarl} />
          <View style={{
            flexDirection: 'row',
            flex: 1, alignItems: 'center',
            paddingLeft: this.props.switchLogo ? 46 : 0
            // alignItems:'flex-start',
            // backgroundColor:'#333a'
          }}>
            {navView}
            <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'flex-start', overflow: 'hidden' }}>
              {/*<Text style={titleStyle} numberOfLines={1}>*/}
              {/*{title}*/}
              {/*</Text>*/}
              {this._renderClickTitle(titleStyle, title)}
            </View>
          </View>
          <View style={{ flexDirection: 'row', marginRight: 8, marginLeft: 8 }}>
            {
              actionsView
            }
          </View>
        </View>
    );
  }

  _renderTitleSuffix() {
    if (!this.props.titleSuffix) return null;
    return (
        <Text style={styles.titleSuffixText} numberOfLines={1}>
          {this.props.titleSuffix}
        </Text>
    );
  }

  _renderClickTitle(titleStyle, title) {
    if (this.props.titleClick) {
      return (
          <Pressable onPress={() => {
            this.props.titleClick()
          }}>
            <View style={{ flex: 1, justifyContent: 'flex-start', flexDirection: 'row', alignItems: 'center' }}>
              <Text style={titleStyle} numberOfLines={1}>
                {title}
              </Text>
              {this._renderTitleSuffix()}
              <Icon style={{ marginLeft: 6 }} type={'icon_arrow_down'} color={'#fff'} size={14} />
            </View>
          </Pressable>
      );
    } else {
      return (
          <View style={{ alignItems: 'center', flex: 1, flexDirection: 'row', justifyContent: 'flex-start' }}>
            <Text style={titleStyle} numberOfLines={1}>
              {title}
            </Text>
            {this._renderTitleSuffix()}
          </View>
      )
    }
  }
}

Toolbar.propTypes = {
  noShadow: PropTypes.bool,
  style: ViewPropTypes.style,
  opacity: PropTypes.number,
  titleColor: PropTypes.string,
  color: PropTypes.string,
  navIcon: PropTypes.string,
  onIconClicked: PropTypes.func,
  tintColor: PropTypes.string,
  title: PropTypes.string,
  actions: PropTypes.any,
  onActionSelected: PropTypes.any,
  borderColor: PropTypes.string,
}

Toolbar.defaultProps = {
  noShadow: false,
  color: GREEN,
  tintColor: GREEN,
  borderColor: LINE,
  opacity: 1
}

var styles = StyleSheet.create({
  navSty: {
    // marginTop:statusBarHeight,
    paddingTop: statusBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent:'space-between',
    // justifyContent:'center',
    height,
    backgroundColor: GREEN,
    borderBottomWidth: 1,

  },
  titleText: {
    fontSize: 17,
    fontWeight: 'bold',
    // textAlign: 'center',
    color: 'white',
    flexShrink: 1
  },
  titleSuffixText: {
    fontSize: 15,
    textAlign: 'center',
    color: '#888',
    marginLeft: 4
  }
});
