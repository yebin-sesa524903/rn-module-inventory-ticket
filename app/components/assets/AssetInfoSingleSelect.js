import React, { Component } from 'react';
import {
  BackHandler,
  DeviceEventEmitter,
  InteractionManager,
  Keyboard,
  Platform,
  ScrollView,
  Text, TextInput,
  View,
} from 'react-native';
import { GREEN, LIST_BG } from "../../styles/color";
import Toolbar from "../Toolbar";
import TouchFeedback from "../TouchFeedback";
import SearchBar from "../SearchBar";
import { isPhoneX } from "../../utils";
import backHelper from "../../utils/backHelper";
import Icon from "../Icon";
import { localStr } from '../../utils/Localizations/localization';
import Colors from "../../../../../app/utils/const/Colors";


class InputView extends Component {

  constructor() {
    super();
    this.state = { value: '' };
  }

  componentDidMount() {
    backHelper.init(this.props.navigation, this.props.route.id);

  }

  componentWillUnmount() {
    backHelper.destroy(this.props.route.id);

  }

  _enableSubmit() {
    return this.state.value && this.state.value.trim().length > 0;
  }

  _doSubmit() {
    // this.props.onBack();
    this.props.onSelect(this.state.value.trim());
  }

  render() {
    return (
      <View style={{ flex: 1, backgroundColor: LIST_BG }}>
        <Toolbar
          title={this.props.title}
          navIcon="back"
          noShadow={true}
          actions={[{ title: localStr('lang_toolbar_ok'), show: 'always', disable: !this._enableSubmit() }]}
          onActionSelected={[() => this._doSubmit()]}
          onIconClicked={() => this.props.onBack()}
        />
        <View style={{ backgroundColor: '#fff', padding: 16, marginTop: 10 }}>
          <TextInput style={{ fontSize: 17, color: '#333', height: 23, padding: 0, paddingHorizontal: 12 }}
            placeholderTextColor={'#d0d0d0'}
            underlineColorAndroid={'transparent'}
            onChangeText={text => {
              this.setState({ value: text })
            }}
            value={this.state.value} placeholder={this.props.hint || localStr('lang_ticket_filter_input')}
          />
        </View>
      </View>
    );
  }
}

export default class SingleSelect extends Component {

  constructor(props) {
    super(props);
    this.state = { value: '', selectRows: props.value };
  }

  _renderListRow(title, index) {
    let rightIcon = null;
    if (this.props.multi && this.state.selectRows && this.state.selectRows.includes(title)) {
      rightIcon = <Icon type={'icon_check'} color={Colors.seTextPrimary} size={17} />
    }
    return (
      <TouchFeedback key={index} onPress={() => this._onSelect(title)}>
        <View style={{
          borderTopColor: Colors.seBorderSplit, padding: 16, justifyContent: 'space-between',
          borderTopWidth: index > 0 ? 1 : 0, alignItems: 'center', flexDirection: 'row',
          backgroundColor: Colors.seBgContainer
        }}>
          <Text style={{ fontSize: 17, color: Colors.seTextPrimary, lineHeight: 23 }}>{title}</Text>
          {rightIcon}
        </View>
      </TouchFeedback>
    )
  }

  _onSelect(text) {
    if (this.props.multi) {
      let selectRows = this.state.selectRows || [];
      if (selectRows.includes(text)) {
        let index = selectRows.indexOf(text);
        selectRows.splice(index, 1);
      } else {
        selectRows.push(text)
      }

      this.state.selectRows = selectRows;
      this.setState({})
      return;
    }
    // if(this.props.disableSelect) return
    this.props.onBack();
    this.props.onSelect(text);
  }

  _toEdit() {
    this.props.navigation.push('PageWarpper',{
      id: 'AssetInfoSingleSelect_InputView',
      component: InputView,
      passProps: {
        hint: this.props.inputHint,
        title: this.props.inputTitle,
        onBack: () => this.props.onBack(),
        onSelect: (text) => {
          this.props.navigation.popN(2);
          this.props.onSelect(text);
        }
      }
    });
  }

  _hasValue() {
    return this.state.value && this.state.value.trim().length > 0;
  }

  _renderList() {
    let empty = (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 14, color: Colors.seTextSecondary }}>{localStr('lang_single_select_search_no_result')}</Text>
      </View>
    )

    if (!this.props.dataList) {
      if (this._hasValue()) {
        return empty;
      }
      return null;
    }

    let findData = this.props.dataList.filter(name => name && name.trim().length > 0);
    if (this._hasValue()) {
      let keyword = this.state.value.trim().toLowerCase();
      findData = this.props.dataList.filter(item => {
        return String(item || '').toLowerCase().indexOf(keyword) >= 0
      });
      if (!findData || findData.length === 0) {
        return empty;
      }
    }
    return findData.map((item, index) => {
      return this._renderListRow(item, index);
    });
  }

  _renderInput() {
    if (!this.props.showInput) return;
    return (
      <>
        <View style={{ height: 10, backgroundColor: Colors.seBgLayout }} />
        <TouchFeedback onPress={() => this._toEdit()}>
          <View style={{ height: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.seBgContainer }}>
            <Text style={{ fontSize: 17, color: Colors.seBrandNomarl }}>{localStr('lang_single_select_manual_input')}</Text>
          </View>
        </TouchFeedback>
      </>
    )
  }

  _searchChanged(text) {
    this.setState({ value: text })
  }

  _registerEvents() {
    this._keyboardDidShowSubscription = Keyboard.addListener('keyboardDidShow', (e) => this._keyboardDidShow(e));
    this._keyboardDidHideSubscription = Keyboard.addListener('keyboardDidHide', (e) => this._keyboardDidHide(e));
  }

  _unRegisterEvents() {
    this._keyboardDidShowSubscription && this._keyboardDidShowSubscription.remove();
    this._keyboardDidHideSubscription && this._keyboardDidHideSubscription.remove();
  }

  _keyboardDidShow(e) {
    let offset = 70;
    if (Platform.OS === 'ios') {
      if (isPhoneX()) offset = 90;
      else offset = 70;
    }
    this.setState({ keyboardHeight: e.endCoordinates.height - offset, showKeyboard: true });
  }

  _keyboardDidHide() {
    this.setState({ keyboardHeight: 0, showKeyboard: false });
  }

  componentDidMount() {

    backHelper.init(this.props.navigation, this.props.route.id);
    this._registerEvents();
    //注册监听
    InteractionManager.runAfterInteractions(() => {
      this._back = BackHandler.addEventListener('hardwareBackPress', () => {
        if (this.state.value.length > 0) {
          this._clear();
          return true;
        }
        return false;
      });
    });
  }

  componentWillUnmount() {

    backHelper.destroy(this.props.route.id);
    this._unRegisterEvents();
    if (this._filterTimer) clearTimeout(this._filterTimer);
    Keyboard.dismiss();
    this._back && this._back.remove();
  }

  _clear(disKeyboard) {
    if (disKeyboard) {
      Keyboard.dismiss();
    }
    this.setState({ value: '' });
  }

  _renderSearch() {
    if (!this.props.showSearch) return;
    return (
      <SearchBar
        style={{ marginTop: -1, backgroundColor: Colors.seBgContainer, borderColor: Colors.seBorderSplit, borderBottomWidth: 1 }}
        value={this.state.value}
        hint={this.props.searchHint || localStr('lang_single_select_input_keyword')}
        showCancel={this.state.showKeyboard || this.state.value.length > 0}
        onCancel={() => this._clear(true)}
        onClear={() => this._clear(false)}
        onChangeText={this._searchChanged.bind(this)}
      />
    )
  }

  _multiSubmit = () => {
    this.props.onBack();
    this.props.onSelect(this.state.selectRows);
  }

  render() {
    let actions = [];
    let actionsClick = [this._multiSubmit];
    if (this.props.multi) {
      actions = [{ title: localStr('lang_toolbar_ok') }]
    }
    return (
      <View style={{ flex: 1, backgroundColor: Colors.seBgLayout }}>
        <Toolbar
          title={this.props.title}
          navIcon="back"
          noShadow={true}
          color={Colors.seBrandNomarl}
          borderColor={Colors.seBrandNomarl}
          actions={actions}
          onActionSelected={actionsClick}
          onIconClicked={() => this.props.onBack()}
        />
        {this._renderSearch()}
        <ScrollView style={{ flex: 1, marginBottom: isPhoneX() ? 34 : 0 }} showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false}
          contentContainerStyle={{ backgroundColor: Colors.seBgLayout }}>
          {this._renderInput()}
          <View style={{ height: 10, backgroundColor: Colors.seBgLayout }} />
          {this._renderList()}
        </ScrollView>
      </View>
    );
  }
}
