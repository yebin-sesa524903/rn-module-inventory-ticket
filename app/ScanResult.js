'use strict'

import React,{Component} from 'react';

import {
  View,Text,
  StyleSheet, Image, TouchableOpacity, Platform, TextInput,
} from 'react-native';

import Toolbar from "./components/Toolbar";
import {GRAY, GREEN} from "./styles/color";
import {localStr} from "./utils/Localizations/localization";
import {isPhoneX} from "./utils";
import SchActionSheet from "./components/actionsheet/SchActionSheet";

const StatusColors = ['#3DCD58','#1F1F1F','#FAAD14','#3491FA','#F53F3F']
const StatusTags = ['在用','闲置中','维修中','调拨中','缺失'];

export default class extends Component{
  constructor(props){
    super(props);
    this.state = {
      tags:[{tag:'故障资产',sel:false},{tag:'待清理资产',sel:false}],
      remark:'',inventoryType:1,statusType:0
    }
  }

  _renderResult() {
    return (
        <View style={{backgroundColor:'#fff',borderRadius:12,margin:16,padding:16}}>
          <View style={{borderBottomColor:'#F0F0F0',borderBottomWidth:1,paddingBottom:16}}>
            <Text style={{color:'#1F1F1F',fontSize:15,fontWeight:'500'}}>盘点结果</Text>
          </View>

          <View style={{flexDirection:'row',alignItems:'center',paddingVertical:12,borderBottomColor:'#F0F0F0',
            borderBottomWidth:1}}>
            <Text style={{color:'#1F1F1F',fontSize:15}}>
              {'盘点结果'}
            </Text>
            <View style={{flex:1}}/>
            {this._renderRadio('已盘',this.state.inventoryType === 1,()=>this.setState({inventoryType:1,statusType:0}))}
            {this._renderRadio('盘亏',this.state.inventoryType === 2,()=>this.setState({inventoryType:2,statusType:4}))}
          </View>
          <View style={{flexDirection:'row',alignItems:'center',paddingVertical:12,borderBottomColor:'#F0F0F0',
            borderBottomWidth:1}}>
            <Text style={{color:'#1F1F1F',fontSize:15}}>
              {'标签'}
            </Text>
            <Text style={{color:'#BFBFBF',fontSize:15}}>
              {'(选填)'}
            </Text>
            <View style={{flex:1}}/>
            {this.state.tags.map(item => this._renderTag(item))}
          </View>
          <TextInput
              style={{fontSize:15,lineHeight:23,color:'#1f1f1f',paddingVertical:6,marginTop:10}}
              underlineColorAndroid={'transparent'}
              textAlign={'left'}
              multiline={true}
              placeholderTextColor={'#BFBFBF'}
              textAlignVertical={'top'}
              placeholder={'请输入备注（选填）'}
              onChangeText={(text)=>this.setState({remark:text})}
              value={this.state.remark} />
        </View>
    )
  }

  _renderRadio(name,sel,cb) {
    return (
        <TouchableOpacity style={{marginLeft:12,flexDirection:'row',alignItems:'center',paddingVertical:6}} onPress={cb}>
          <View style={{width:16,height:16,alignItems:'center',justifyContent:'center',borderRadius:8,borderWidth:1,borderColor:sel?GREEN:'#D9D9D9'}}>
            <View style={{width:10,height:10,borderRadius:5,backgroundColor:sel?GREEN:undefined}}/>
          </View>
          <Text style={{fontSize:15,color:'#1f1f1f',marginLeft:6}}>{name}</Text>
        </TouchableOpacity>
    )
  }

  _renderTag(item) {
    let bg = item.sel?'#F0FFF0':'#F5F5F5';
    let fg = item.sel?GREEN:'#595959';
    return (
        <TouchableOpacity key={item.tag} onPress={()=>{
          item.sel = !item.sel
          this.setState({})
        }}
            style={{marginLeft:10,paddingHorizontal:10,paddingVertical:6,borderRadius:4,backgroundColor:bg}}>
          <Text style={{color:fg,fontSize:15}}>{item.tag}</Text>
        </TouchableOpacity>
    )
  }

  _showStatusTagsDialog = () => {
      this.setState({
          modalVisible:true,
          statusTags:StatusTags.slice(0,4).map((tag,index) => {
              return {
                  title:tag,
                  click:()=>this.setState({
                      modalVisible:false,
                      statusType:index
                  })
              }
          })
      })
  }

  _renderStatusTag() {
      let color = StatusColors[this.state.statusType];
      let tag = StatusTags[this.state.statusType];
      return (
          <TouchableOpacity disabled={this.state.statusType === 4} onPress={this._showStatusTagsDialog}>
          <View style={{borderRadius:2,paddingHorizontal:6,marginLeft:6,
              borderWidth:1, borderColor:color,paddingVertical:2,justifyContent:'center',alignItems:'center'}}>
              <Text style={{color,fontSize:12}}>{tag}</Text>
          </View>
          </TouchableOpacity>
      )
  }

    _renderActionSheet() {
        let arrActions=this.state.statusTags;
        if (!arrActions) {
            return;
        }
        if (this.state.modalVisible) {
            return(
                <SchActionSheet title={this.state.title} arrActions={arrActions} modalVisible={this.state.modalVisible}
                    onCancel={()=>{
                        this.setState({'modalVisible':false});
                    }}
                    onSelect={item=>{
                        this.setState({modalVisible:false},()=>{
                            setTimeout(()=>{
                                item.click();
                            },200);
                        });
                    }}>
                </SchActionSheet>
            )
        }
    }

  render(){
    return (
        <View style={{flex:1,backgroundColor:'#F4F6F8'}}>
          <Toolbar
              title={'盘点结果'}
              navIcon="back"
              onIconClicked={()=>{
                this.props.navigator.pop()
              }}
              actions={[]}
              onActionSelected={[]}
          />
          <View style={{flexDirection:'row',alignItems:'center',marginTop:10,marginHorizontal:16,borderTopColor:'#f5f5f5',
            borderTopWidth:1,paddingTop:10}}>
            <Image resizeMode={'cover'} style={{width:70,height:50,borderRadius:8,backgroundColor:'#f5f5f5'}}
                   defaultSource={require('./images/building_default/building.png')}
                   source={''}/>
            <View style={{marginLeft:16,flex:1}}>
                <View style={{flexDirection:'row',justifyContent:'space-between'}}>
                    <Text style={{color:'#333',fontSize:14,flex:1}}>{'设备名称,想把脸上胖度，立刻马上就是赶快华纳会给你呀'}</Text>
                    {this._renderStatusTag()}
                </View>

              <Text style={{color:'#666',fontSize:12,marginTop:8}}>{`编号：`}</Text>
            </View>
          </View>
          {this._renderResult()}
          <TouchableOpacity style={{position:'absolute',left:16,right:16,bottom:isPhoneX()?32:16,height:44,
            backgroundColor:GREEN,borderRadius:8,alignItems:'center',justifyContent:'center'
          }}>
            <Text style={{fontSize:17,color:'#fff'}}>{'确认盘点'}</Text>
          </TouchableOpacity>
            {this._renderActionSheet()}
        </View>
    )
  }

}

