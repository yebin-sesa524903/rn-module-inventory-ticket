import React, { Component } from 'react';
import {
  DeviceEventEmitter, Dimensions,
  Image, InteractionManager,
  Platform, Pressable,
  RefreshControl,
  SafeAreaView,
  SectionList,
  Text,
  View
} from "react-native";
import { GREEN } from "./styles/color";
import TicketRow from "./TicketRow";
import { localStr } from "./utils/Localizations/localization";
import TicketDetail from "./TicketDetail";
import {
  apiAppTicketList,
  apiHierarchyList, customerId,
} from "./middleware/bff";

import { isPhoneX } from "./utils";
import privilegeHelper, { CodeMap } from "./utils/privilegeHelper";
import Colors, {isDarkMode} from "../../../app/utils/const/Colors";

const MP = Platform.OS === 'ios' ? (isPhoneX() ? 0 : 10) : 36;
const CODE_OK = '0';
const DAY_FORMAT = 'YYYY-MM-DD';

const TICKET_TYPE_MAP = {
  10: localStr('lang_status_1'),
  20: localStr('lang_status_2'),
  30: localStr('lang_status_3'),
  40: localStr('lang_status_4'),
  50: localStr('lang_status_5'),
  60: localStr('lang_status_6')
}

export default class TicketList extends Component {

  constructor(props) {
    super(props);
    this.state = {
      refreshing: false,
      hasPermission: (privilegeHelper.hasAuth(CodeMap.AssetTicketExecute) ||
        privilegeHelper.hasAuth(CodeMap.AssetTicketFull) ||
        privilegeHelper.hasAuth(CodeMap.AssetTicketRead)),
      selectedIndex: 0,///当前选择item  未完成/已完成
      pageIndex: 1,///当前页
      hasMore: false,///默认没有更多数据
      unDoneCount: 0, ///未完成个数
      doneCount: 0,///已完成个数
    }
  }

  componentDidMount() {
    InteractionManager.runAfterInteractions(() => {
      if (privilegeHelper.hasCodes()) {
        this._loadApiHierarchyList();
      } else {
        this.setState({ refreshing: true, hasPermission: true })
      }
    })
  }

  componentWillUnmount() {
    this._initListener && this._initListener.remove();
  }

  _renderEmpty() {
    if (!this.state.refreshing && this.state.error) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.seBgContainer }}>
          <Text style={{ fontSize: 15, color: Colors.seTextPrimary, marginTop: 8 }}>{this.state.error}</Text>
        </View>
      )
    }
    if (this.state.refreshing) return null;
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center',backgroundColor:Colors.seBgContainer, height: (Dimensions.get('window').height - 220) }}>
        <Image resizeMode={'contain'} source={isDarkMode() ? require('./images/empty_box/empty_box_dark.png') : require('./images/empty_box/empty_box.png')} style={{width: 128 * 0.5, height: 80 * 0.5}} />
        <Text style={{ fontSize: 14, color: Colors.seTextDisabled, marginTop: 8 }}>{localStr('lang_empty_data')}</Text>
      </View>
    )
  }

  /**
   * 获取层级结构
   * @private
   */
  _loadApiHierarchyList() {
    this.setState({
      locations: this.props.hierarchyList
    }, () => {
      this._loadTicketList();
      ///第一次进入需要获取一下已完成的个数
      this._loadDoneCount();
    })
  }

  /**
   * 已完成的个数
   * @private
   */
  _loadDoneCount() {
    let locations = [];
    for (const re of this.state.locations) {
      locations.push({
        locationId: re.id,
        locationType: re.templateId,
      });
    }
    let params = {
      ticketTypes: [11, 12],
      ticketStatus: [50],
      locations: locations,
      pageIndex: 1,
      pageSize: 20,
    };
    apiAppTicketList(params).then((data) => {
      if (data.code === CODE_OK) {
        this.setState({
          doneCount: data.data.total,
        })
      }
    });
  }

  _getLocationInfo(hierarchies, locationId) {
    let locationMsg = '';
    let parentName = '';
    let parentParentName = '';
    let parentId = 0;
    for (let hierarchy of hierarchies) {
      if (locationId == hierarchy.id) {
        locationMsg = hierarchy.name;
        parentId = hierarchy.parentId;
        break;
      }
    }
    let parParentId = 0;
    for (let hierarchy of hierarchies) {
      if (parentId == hierarchy.id) {
        parentName = hierarchy.name;
        parParentId = hierarchy.parentId;
        break;
      }
    }
    for (let hierarchy of hierarchies) {
      if (parParentId == hierarchy.id) {
        parentParentName = hierarchy.name;
        break;
      }
    }
    return parentParentName + '/' + parentName + '/' + locationMsg;
  }


  _loadTicketList() {
    this.setState({ refreshing: true, showEmpty: false, error: null })
    //处理加载中等...
    let locations = [];
    for (const re of this.state.locations) {
      locations.push({
        locationId: re.id,
        locationType: re.templateId,
      });
    }
    let params = {
      ticketTypes: [11, 12],
      ticketStatus: this.state.selectedIndex === 0 ? [10, 20, 30, 40] : [50],
      locations: locations,
      pageIndex: this.state.pageIndex,
      pageSize: 20,
      customerId: customerId,
    };
    apiAppTicketList(params).then((data) => {
      if (data.code === CODE_OK) {
        let responseObj = data.data;
        ///处理空数据
        if (!responseObj || responseObj.list?.length === 0) {
          this.setState({ showEmpty: true, refreshing: false })
          return;
        }
        ///处理分页逻辑
        let tickets = [];
        let hasMoreData = (responseObj.list?.length >= responseObj.pageSize);
        if (this.state.pageIndex === 1) {
          tickets = responseObj.list;
        } else {
          tickets = this.state.ticketData[0].data.concat(responseObj.list);
        }
        ///位置信息 赋值
        for (const dataObj of tickets) {
          for (const location of this.state.locations) {
            if (location.id == dataObj.objectId) {
              dataObj.locationInfo = this._getLocationInfo(this.state.locations, location.id);
            }
          }
        }
        let stateTicket = tickets.length === 0 ? [] : [{ data: tickets }];
        this.setState({ ticketData: stateTicket, hasMore: hasMoreData, refreshing: false })

        ///未完成/已完成个数赋值
        if (this.state.selectedIndex === 0) {
          ///未完成
          this.setState({
            unDoneCount: responseObj.total
          })
        } else {
          ///已完成
          this.setState({
            doneCount: responseObj.total
          })
        }
      } else {
        //请求失败
        let update = { ticketData: [],refreshing: false, error: data.msg, showEmpty: true }
        if (data.code === '401') update.hasPermission = false;
        this.setState(update)
      }
    });
  }

  _renderRow = (info) => {
    let rowData = info.item;
    return (
      <TicketRow rowData={rowData} onRowClick={this._gotoDetail} onInventoryItemClick={this._gotoDetail} />
    );
  }

  _gotoDetail = (rowData, selectIndex = 0) => {
    console.log('rowData', rowData)
    this.props.navigation.push('PageWarpper',{
      id: 'service_ticket_detail',
      component: TicketDetail,
      passProps: {
        ticketId: rowData.id,
        deviceTab: selectIndex,
        ticketChanged: () => this._onRefresh()
      }
    })
  }

  _renderFooterView = () => {
    if (!this.state.hasMore) return null;
    return (
      <View style={{ height: 40, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'black' }}>{localStr('lang_load_more')}</Text>
      </View>
    )
  }

  _onRefresh = () => {
    if (!this.state.refreshing) {
      //没有刷新就做
      this.setState({
        pageIndex: 1
      }, () => this._loadTicketList())
    }
  }

  _loadMore = () => {
    if (!this.state.refreshing && this.state.hasMore) {
      //没有刷新就做
      let pageNo = this.state.pageIndex || 1;
      pageNo++;
      this.setState({
        pageIndex: pageNo,
      }, () => this._loadTicketList());
    }
  }


  _getView() {
    if (this.state.showEmpty) return this._renderEmpty();
    return (
      <SectionList style={{ flex: 1, paddingHorizontal: 16, backgroundColor: Colors.seBgContainer }}
        sections={this.state.ticketData}
        refreshControl={
          <RefreshControl
            refreshing={this.state.refreshing}
            onRefresh={this._onRefresh}
            tintColor={Colors.theme}
            title={localStr('lang_load_more')}
            colors={[Colors.theme]}
            progressBackgroundColor={'white'}
          />
        }
        stickySectionHeadersEnabled={true}
        renderItem={this._renderRow}
        ListEmptyComponent={() => this._renderEmpty()}
        refreshing={this.state.refreshing}
        onRefresh={this._onRefresh}
        onEndReachedThreshold={0.1}
        onEndReached={this._loadMore}
        ListFooterComponent={this._renderFooterView}
      />
    )
  }
  _renderNoPermission() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
        <Image source={require('./images/empty_box/empty_box.png')} style={{ width: 60, height: 40 }} />
        <Text style={{ fontSize: 15, color: Colors.seTextSecondary, marginTop: 8 }}>{localStr('lang_ticket_list_no_permission')}</Text>
      </View>
    );
  }

  _renderSectionHeader() {
    return (
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 54,
        borderTopRightRadius: 8,
        borderTopLeftRadius: 8,
        overflow: 'hidden',
        backgroundColor: Colors.seBgContainer
      }}>
        <View style={{ flexDirection: 'row' }}>
          <Pressable onPress={() => {
            this.setState({
              selectedIndex: 0,
              pageIndex: 1,
            }, () => this._loadTicketList())
          }}
            style={{ paddingLeft: 12, paddingRight: 12 }}>
            <Text style={{
              fontSize: 14,
              fontWeight: this.state.selectedIndex === 0 ? 'bold' : 'normal',
              color: this.state.selectedIndex === 0 ? Colors.seBrandNomarl : Colors.seTextPrimary
            }}>{`${localStr('lang_ticket_list_tab_undone')}(${this.state.unDoneCount})`}</Text>
          </Pressable>
          <Pressable onPress={() => {
            this.setState({
              selectedIndex: 1,
              pageIndex: 1,
            }, () => this._loadTicketList())
          }}
            style={{ paddingLeft: 12, paddingRight: 12 }}>
            <Text style={{
              fontSize: 14,
              fontWeight: this.state.selectedIndex === 1 ? 'bold' : 'normal',
              color: this.state.selectedIndex === 1 ? Colors.seBrandNomarl : Colors.seTextPrimary
            }}>{`${localStr('lang_ticket_list_tab_done')}(${this.state.doneCount})`}</Text>
          </Pressable>
        </View>
        <View style={{ position: 'absolute', left: 12, right: 12, bottom: 0, backgroundColor: Colors.seBorderSplit, height: 1 }} />
      </View>
    )
  }

  render() {
    if (!this.state.hasPermission) {
      return this._renderNoPermission()
    }

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.seBgContainer }}>
        <View style={{ flex: 1 , backgroundColor: Colors.seBrandNomarl}}>
          {this._renderSectionHeader()}
          {this._getView()}
        </View>
      </SafeAreaView>
    );
  }
}


