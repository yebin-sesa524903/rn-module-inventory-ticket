'use strict'

import React,{Component} from 'react';

import {
    View,
    StyleSheet, Image, TouchableOpacity, Platform, TextInput, ScrollView,
} from 'react-native';

import Text from './components/Text';
import Toolbar from "./components/Toolbar";
import {GRAY, GREEN} from "./styles/color";
import moment from 'moment';
import {isPhoneX} from "./utils";
import Icon from "./components/Icon";
import SingleSelect from "../../app/components/assets/AssetInfoSingleSelect";
import DateTimePicker from "react-native-modal-datetime-picker";


const DataGroup = [
    {
        groupName:'基本信息',
        items:[
            {key:'productName',name:'产品名称',input:true},
            {key:'ProductNum',name:'产品编号',input:true},
            {key:'placeAt',name:'所在门店',onRead:true,},
            {key:'manufacturer',name:'生产厂商',input:true,option:true},
            {key:'buyDate',name:'采购日期',date:true,option:true},
            {key:'buyAmount',name:'采购金额',option:true,input:true},
            {key:'installDate',name:'安装日期',date:true,option:true,select:true},
            {key:'description',name:'产品描述',option:true,input:true}
        ]
    },
    {
        groupName:'参数配置',
        items:[
            {key:'deviceClass',name:'设备总称',select:true},
            {key:'deviceType',name:'设备类型',select:true},
            {key:'deviceModel',name:'设备型号',select:true},
            {key:'poleNum',name:'极数',option:true,select:true},
            {key:'manufactureDate',name:'生产日期',option:true,date:true,select:true},
            {key:'incoming',name:'进线方式',option:true,select:true},
            {key:'voltage',name:'额定电压',option:true,select:true},
        ]
    }
]

function getData() {
    return {
        productName:'',
        ProductNum:'',
        placeAt:'',
        manufacturer:'',
        buyDate:'',
        buyAmount:'',
        installDate:'',
        description:'',
        deviceClass:'',
        deviceType:'',
        deviceModel:'',
        poleNum:'',
        manufactureDate:'',
        incoming:'',
        voltage:''
    }
}

const DeviceTplKey = ['deviceClass','deviceType','deviceModel'];

const DeviceTpl = [
    {
        title:'总称1',
        items:[
            {
                title:'类型1-1',
                items:[
                    {title:'型号1-1-1'},
                    {title:'型号1-1-2'}
                ]
            },
            {
                title:'类型1-2',
                items:[
                    {title:'型号1-2-1'},
                    {title:'型号1-2-2'}
                ]
            }
        ]
    },
    {
        title:'总称2',
        items:[
            {
                title:'类型2-1',
                items:[
                    {title:'型号2-1-1'},
                    {title:'型号2-1-2'}
                ]
            },
            {
                title:'类型2-2',
                items:[
                    {title:'型号2-2-1'},
                    {title:'型号2-2-2'}
                ]
            }
        ]
    }
]


export default class extends Component{
  constructor(props){
    super(props);

    this.state = {
        data : getData()
    }
  }

  _textChanged(key,text) {
      this.state.data[key] = text
      this.setState({})
  }

  //输入行
  _renderInputRow(row) {
      return (
          <View style={{flexDirection:'row',alignItems:'center',paddingVertical:12,borderTopWidth:1,borderTopColor:'#f0f0f0'}}>
            <Text style={{color:'#595959',fontSize:15}}>{row.name}</Text>
              {
                  !row.option ? null :
                      <Text style={{color:'#BFBFBF',fontSize:15,marginLeft:6}}>{'(选填)'}</Text>
              }
              <View style={{flex:1}}/>
              <TextInput numberOfLines={1} style={{fontSize:15,paddingVertical:0,color:'#595959',marginRight:6}}
                         value={this.state.data[row.key]} placeholder={'请输入'} editable={!row.readOnly}
                         placeholderTextColor={'#BFBFBF'} underlineColorAndroid="transparent" returnKeyType={'done'}
                         onChangeText={text=>this._textChanged(row.key,text)}/>
          </View>
      )
  }



  _clickSelect(row) {
      if(row.date) {
          this._paramDate = row.key;
          this.setState({modalVisible:true})
          return;
      }
      let data = ['a','b','c']
      let callback = null;
      if(DeviceTplKey.includes(row.key)) {
       switch (row.key) {
           case DeviceTplKey[0]:
               data = DeviceTpl.map(item => item.title)
               callback = () => {
                   this.state.data[DeviceTplKey[1]] = '';
                   this.state.data[DeviceTplKey[2]] = '';
               }
               break;
           case DeviceTplKey[1]:
               if(!this.state.data[DeviceTplKey[0]]) return null;
               data = DeviceTpl.find(item => item.title === this.state.data[DeviceTplKey[0]]).items.map(item => item.title)
               callback = () => {
                   this.state.data[DeviceTplKey[2]] = '';
               }
               break;
           case DeviceTplKey[2]:
               if(!this.state.data[DeviceTplKey[1]]) return null;
               data = DeviceTpl.find(item => item.title === this.state.data[DeviceTplKey[0]]).items
                   .find(item => item.title === this.state.data[DeviceTplKey[1]]).items
                   .map(item => item.title)
               break;
       }
      }

      this.props.navigator.push({
          id:'device_add',
          component:SingleSelect,
          passProps:{
              title:`请选择${row.name}`,
              dataList:data,
              onSelect:text => {
                  this.state.data[row.key] = text;
                  if(callback) callback();
                  this.setState({})
              },
              onBack:this._doBack,
              onRefresh:()=>{}
          }
      })
  }

  //选择行
  _renderSelectRow(row) {
      return (
          <TouchableOpacity style={{flexDirection:'row',alignItems:'center',paddingVertical:12,borderTopWidth:1,borderTopColor:'#f0f0f0'}}
            onPress={()=>this._clickSelect(row)}
          >
              <Text style={{color:'#595959',fontSize:15}}>{row.name}</Text>
              {
                  !row.option ? null :
                      <Text style={{color:'#BFBFBF',fontSize:15,marginLeft:6}}>{'(选填)'}</Text>
              }
              <View style={{flex:1}}/>
              <Text style={{color:this.state.data[row.key]?'#595959':'#BFBFBF',fontSize:15,marginHorizontal:6}}>{this.state.data[row.key] || '请选择'}</Text>
              <Icon type={'arrow_right'} color={'#595959'} size={14}/>
          </TouchableOpacity>
      )
  }

    _getDateTime() {
      return moment(this.state.data[this._paramDate] || undefined).toDate();
    }

    _renderPickerDate() {
        return (
            <DateTimePicker
                is24Hour={true}
                titleIOS={'选择日期'}
                headerTextIOS={'选择日期'}
                titleStyle={{fontSize: 17, color: '#333'}}
                cancelTextIOS={'取消'}
                confirmTextIOS={'确定'}
                mode={'date'}
                datePickerModeAndroid={'spinner'}
                date={this._getDateTime()}
                onDateChange={(date) => {

                }}
                isVisible={this.state.modalVisible}
                onConfirm={(date) => {
                    let obj = {
                        modalVisible: false
                    };
                    // if(this._paramDate) {
                    //     this._paramDate.Value = moment(date).format('YYYY-MM-DD')
                    // }else {
                    //     obj[this.state.dateType] = date;
                    // }
                    this.state.data[this._paramDate] = moment(date).format('YYYY-MM-DD');
                    this.setState(obj);
                    this._paramDate = null;
                }}
                onCancel={() => {
                    this._paramDate = null;
                    this.setState({modalVisible: false})
                }}
            />
        )
    }

  _renderGroup(item) {
      return (
          <View key={item.groupName} style={{backgroundColor:'#fff',margin:16,marginBottom:0,padding:16,borderRadius:12}}>
            <Text style={{fontSize:15,color:'#1f1f1f',marginBottom:10}}>{item.groupName}</Text>
              {
                  item.items.map(row => {
                      if(row.select) return this._renderSelectRow(row)
                      return this._renderInputRow(row)
                  })
              }
          </View>
      )
  }

  _doBack = () => this.props.navigator.pop();


  render(){
    return (
        <View style={{flex:1,backgroundColor:'#F4F6F8'}}>
          <Toolbar
              title={'盘盈'}
              navIcon="back"
              onIconClicked={this._doBack}
              actions={[]}
              onActionSelected={[]}
          />
          <ScrollView style={{flex:1}}>
              {DataGroup.map(group => this._renderGroup(group))}
          </ScrollView>
          <TouchableOpacity style={{marginHorizontal:16,marginTop:10,marginBottom:isPhoneX()?32:16,height:44,
            backgroundColor:GREEN,borderRadius:8,alignItems:'center',justifyContent:'center'
          }}>
            <Text style={{fontSize:17,color:'#fff'}}>{'确认盘点'}</Text>
          </TouchableOpacity>
            {this._renderPickerDate()}
        </View>
    )
  }

}

