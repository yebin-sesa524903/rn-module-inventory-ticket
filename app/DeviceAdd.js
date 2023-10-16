'use strict';

import React, { Component } from 'react';

import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';

import Text from './components/Text';
import Toolbar from './components/Toolbar';
import { ADDICONCOLOR, GRAY, GREEN } from './styles/color';
import moment from 'moment';
import { isPhoneX } from './utils';
import Icon from './components/Icon';
import SingleSelect from './components/assets/AssetInfoSingleSelect';
import DateTimePicker from 'react-native-modal-datetime-picker';
import { apiAddDeviceInitData, apiGetOssPath, apiHierarchyTpl, apiTplTree, apiUploadFile, userId, userName } from './middleware/bff';
import TouchFeedback from './components/TouchFeedback';
import ImagePicker from './components/ImagePicker';
import RNFS, { DocumentDirectoryPath } from 'react-native-fs';
import Loading from './components/Loading';
const DataGroup = () => [
  {
    groupName: '基本信息',
    items: [
      { key: 'productName', name: '资产名称', input: true },
      { key: 'ProductNum', name: '资产编号', input: true },
      { key: 'placeAt', name: '所在门店', onRead: true },
      // {key:'manufacturer',name:'生产厂商',input:true,option:true},
      // {key:'buyDate',name:'采购日期',date:true,option:true},
      // {key:'buyAmount',name:'采购金额',option:true,input:true},
      // {key:'installDate',name:'安装日期',date:true,option:true,select:true},
      // {key:'description',name:'产品描述',option:true,input:true}
    ],
  },
  {
    groupName: '参数配置',
    items: [
      { key: 'deviceClass', name: '设备总称', select: true },
      { key: 'deviceType', name: '设备类型', select: true },
      { key: 'deviceModel', name: '设备型号', select: true },
      // {key:'poleNum',name:'极数',option:true,select:true},
      // {key:'manufactureDate',name:'生产日期',option:true,date:true,select:true},
      // {key:'incoming',name:'进线方式',option:true,select:true},
      // {key:'voltage',name:'额定电压',option:true,select:true},
    ],
    options: [], //这里是根据选择的总称类型型号里的参数动态变化的
  },
];

function getData() {
  return {
    productName: '',
    ProductNum: '',
    placeAt: '',
    // manufacturer:'',
    // buyDate:'',
    // buyAmount:'',
    // installDate:'',
    // description:'',
    deviceClass: '',
    deviceType: '',
    deviceModel: '',
    // poleNum:'',
    // manufactureDate:'',
    // incoming:'',
    // voltage:''
  };
}

const DeviceTplKey = ['deviceClass', 'deviceType', 'deviceModel'];

const isCodeOk = (code) => code === 0 || code === '0';

export default class extends Component {
  constructor(props) {
    super(props);

    this.state = {
      data: getData(),
      groupData: DataGroup(),
    };
    if (props.placeAt) this.state.data.placeAt = props.placeAt;
    this.tplData = [];
  }

  componentDidMount() {
    apiGetOssPath().then(ret => {
      console.log('oss path', ret);
    })
    //spid固定70
    apiTplTree('70').then((data) => {
      if (isCodeOk(data.Code)) {
        this.tplData = data.Data;
      } else {
        Alert.alert('', data.Msg || '获取模板数据失败！', [
          { text: '确定', onPress: () => { } },
        ]);
      }
      console.log('tpl tree', data);
    });

    apiHierarchyTpl().then(data => {
      console.log('hierarchyTpl', data);
      if (isCodeOk(data.Code)) {
        this.tplH = data.Data.datas.find(item => item.name === '设备');
      } else {
        Alert.alert('', data.Msg || '获取层级模板数据失败！', [
          { text: '确定', onPress: () => { } },
        ]);
      }
    })
  }

  _textChanged(key, text, row) {
    if (row.isOptions) {
      row.Value = text;
      this.setState({});
      return;
    }
    this.state.data[key] = text;
    this.setState({});
  }

  //输入行
  _renderInputRow(row) {
    let value = '';
    if (row.isOptions) {
      value = row.Value || '';
    } else {
      value = this.state.data[row.key];
    }
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
        }}
      >
        <Text style={{ color: '#595959', fontSize: 15 }}>{row.name}</Text>
        {!row.option ? null : (
          <Text style={{ color: '#BFBFBF', fontSize: 15, marginLeft: 6 }}>
            {'(选填)'}
          </Text>
        )}
        <View style={{ flex: 1 }} />
        <TextInput
          numberOfLines={1}
          style={{
            fontSize: 15,
            paddingVertical: 0,
            color: '#595959',
            marginRight: 6,
          }}
          textAlign='right'
          value={value}
          placeholder={'请输入'}
          editable={!row.readOnly}
          placeholderTextColor={'#BFBFBF'}
          underlineColorAndroid="transparent"
          returnKeyType={'done'}
          onChangeText={(text) => this._textChanged(row.key, text, row)}
        />
      </View>
    );
  }

  _clickSelect(row) {
    if (row.date) {
      this._paramDate = row.key;
      this._dateRow = row;
      this.setState({ modalVisible: true });
      return;
    }
    let data = []; //['a','b','c']
    let callback = null;
    if (DeviceTplKey.includes(row.key)) {
      switch (row.key) {
        case DeviceTplKey[0]:
          data = this.tplData.map((item) => item.Class);
          callback = () => {
            this.state.data[DeviceTplKey[1]] = '';
            this.state.data[DeviceTplKey[2]] = '';
            this.state.groupData[1].options = [];
          };
          break;
        case DeviceTplKey[1]:
          if (!this.state.data[DeviceTplKey[0]]) return null;
          data = this.tplData
            .find((item) => item.Class === this.state.data[DeviceTplKey[0]])
            .Children.map((item) => item.Type);
          callback = () => {
            this.state.data[DeviceTplKey[2]] = '';
            this.state.groupData[1].options = [];
          };
          break;
        case DeviceTplKey[2]:
          if (!this.state.data[DeviceTplKey[1]]) return null;
          data = this.tplData
            .find((item) => item.Class === this.state.data[DeviceTplKey[0]])
            .Children.find(
              (item) => item.Type === this.state.data[DeviceTplKey[1]]
            )
            .Children.map((item) => item.Specification);
          callback = (spc) => {
            //这里还要判断有没有参数
            let values = this.tplData
              .find((item) => item.Class === this.state.data[DeviceTplKey[0]])
              .Children.find(
                (item) => item.Type === this.state.data[DeviceTplKey[1]]
              )
              .Children.find((item) => item.Specification === spc).Values;
            if (values && values.length > 0) {
              this.state.groupData[1].options = values.map((v) => {
                return {
                  isOptions: true,
                  key: v.ValueName,
                  name: v.ValueName,
                  option: true,
                  inputType: v.InputType,
                  date: v.ValueName.includes('日期'), //,
                  select: v.InputType !== 0,
                  multi: v.InputType === 1,
                  data: v.ValueText,
                };
              });
            }
          };
          break;
      }
    } else {
      data = row.data;
    }

    this.props.navigator.push({
      id: 'device_add',
      component: SingleSelect,
      passProps: {
        title: `请选择${row.name}`,
        dataList: data,
        multi: row.multi,
        value: row.Value,
        onSelect: (text) => {
          if (row.isOptions) {
            row.Value = text;
          } else {
            this.state.data[row.key] = text;
          }
          if (callback) callback(text);
          this.setState({});
        },
        onBack: this._doBack,
        onRefresh: () => { },
      },
    });
  }

  //选择行
  _renderSelectRow(row) {
    let value = '';
    let color = '#BFBFBF';
    if (row.isOptions) {
      value = row.Value;
      if (Array.isArray(value)) {
        value = value.join(',');
      }
      if (value) {
        color = '#595959';
      } else {
        value = '请选择';
      }
    } else {
      value = this.state.data[row.key];
      if (value) {
        color = '#595959';
      } else {
        value = '请选择';
      }
    }
    return (
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
        }}
        onPress={() => this._clickSelect(row)}
      >
        <Text style={{ color: '#595959', fontSize: 15 }}>{row.name}</Text>
        {!row.option ? null : (
          <Text style={{ color: '#BFBFBF', fontSize: 15, marginLeft: 6 }}>
            {'(选填)'}
          </Text>
        )}
        {/*<View style={{flex:1}}/>*/}
        <Text
          style={{
            color,
            fontSize: 15,
            marginHorizontal: 6,
            flex: 1,
            textAlign: 'right',
          }}
        >
          {value}
        </Text>
        <Icon type={'arrow_right'} color={'#595959'} size={14} />
      </TouchableOpacity>
    );
  }

  _getDateTime() {
    if (this._dateRow && this._dateRow.isOptions) {
      return moment(this._dateRow.Value || undefined).toDate();
    }
    return moment(this.state.data[this._paramDate] || undefined).toDate();
  }

  _renderPickerDate() {
    return (
      <DateTimePicker
        is24Hour={true}
        titleIOS={'选择日期'}
        headerTextIOS={'选择日期'}
        titleStyle={{ fontSize: 17, color: '#333' }}
        cancelTextIOS={'取消'}
        confirmTextIOS={'确定'}
        mode={'date'}
        datePickerModeAndroid={'spinner'}
        date={this._getDateTime()}
        onDateChange={(date) => { }}
        isVisible={this.state.modalVisible}
        onConfirm={(date) => {
          let obj = {
            modalVisible: false,
          };
          if (this._dateRow.isOptions) {
            this._dateRow.Value = moment(date).format('YYYY-MM-DD');
          } else {
            this.state.data[this._paramDate] =
              moment(date).format('YYYY-MM-DD');
          }

          this.setState(obj);
          this._paramDate = null;
          this._dateRow = null;
        }}
        onCancel={() => {
          this._paramDate = null;
          this._dateRow = null;
          this.setState({ modalVisible: false });
        }}
      />
    );
  }

  _openImagePicker = () => {
    this.props.navigator.push({
      id: 'imagePicker',
      component: ImagePicker,
      passProps: {
        max: 1,
        onBack: () => this.props.navigator.pop(),
        done: (data) => {
          this.props.navigator.pop();
          this.state.logo = data[0];
          this.setState({});
          this._uploadImages();
        },
      },
    });
  };

  _uploadImages() {
    const CODE_OK = '0';
    let find = this.state.logo; //pictures.find(item => item.uri && !item.key && !item.error);
    let readAndUpload = (file) => {
      find.loading = true;
      RNFS.readFile(file, 'base64').then((str) => {
        //这里调用接口处理
        apiUploadFile({
          content: str,
          name: find.filename,
        }).then((ret) => {
          find.loading = false;
          if (ret.code === CODE_OK) {
            find.key = ret.data.key;
            find.name = ret.data.name;
            this.setState({});
          } else {
            //上传失败，重新上传
            find.error = true;
            this.state.logo = null;
            this.setState({});
          }
        });
      });
    };
    if (find) {
      //先找base64字符串
      let destFile = `${DocumentDirectoryPath}/${find.filename}`;
      if (Platform.OS === 'ios') {
        if (find.uri.startsWith('/')) {
          readAndUpload(find.uri);
        } else {
          RNFS.copyAssetsFileIOS(find.uri, destFile, 0, 0).then(() => {
            readAndUpload(destFile);
          });
        }
      } else {
        readAndUpload(find.uri);
      }
    }
    this.setState({})
  }

  _renderImage() {
    let child = null;
    if (this.state.logo && !this.state.logo.error) {
      child = (
        <Image
          source={{ uri: this.state.logo.uri }}
          style={{ width: 78, height: 78 }}
        />
      );
    }
    let childLoading = null;
    if (this.state.logo && this.state.logo.loading) {
      childLoading = (
        <View style={{ position: 'absolute', width: 20, height: 20 }}>
          <Loading />
        </View>
      );

    }
    return (
      <View
        style={{
          backgroundColor: '#fff',
          margin: 16,
          marginBottom: 0,
          padding: 16,
          borderRadius: 12,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#f0f0f0',
          }}
        >
          <Text style={{ fontSize: 15, color: '#1f1f1f' }}>{'照片'}</Text>
          {/* <Text style={{ color: '#BFBFBF', fontSize: 15, marginLeft: 6 }}>
            {'(选填)'}
          </Text> */}
        </View>
        <TouchableOpacity
          style={{
            borderWidth: 1,
            borderColor: '#d9d9d9',
            marginTop: 12,
            alignItems: 'center',
            justifyContent: 'center',
            width: 80,
            height: 80,
          }}
          onPress={this._openImagePicker}
        >
          {child ? child : <Icon type="icon_add" size={36} color={'#d9d9d9'} />}
          {childLoading}
        </TouchableOpacity>
      </View>
    );
  }

  _renderGroup(item) {
    let optionRows = null;
    if (item.options && item.options.length > 0) {
      optionRows = item.options.map((op) => {
        if (op.inputType === 0 && !op.date) {
          return this._renderInputRow(op);
        } else {
          return this._renderSelectRow(op);
        }
      });
    }
    return (
      <View
        key={item.groupName}
        style={{
          backgroundColor: '#fff',
          margin: 16,
          marginBottom: 0,
          padding: 16,
          borderRadius: 12,
        }}
      >
        <Text style={{ fontSize: 15, color: '#1f1f1f', marginBottom: 10 }}>
          {item.groupName}
        </Text>
        {item.items.map((row) => {
          if (row.select) return this._renderSelectRow(row);
          return this._renderInputRow(row);
        })}
        {optionRows}
      </View>
    );
  }

  _doBack = () => this.props.navigator.pop();

  _doSubmit = () => {

    //资产名称、编号、总称、类型、型号都不能为空
    let find = Object.keys(this.state.data).find((key) => {
      let value = this.state.data[key];
      if (!value) return true;
    });
    if (find || !this.state.logo) {
      Alert.alert('', '资产名称、编号、总称、类型、型号、图片都不能为空', [
        { text: '确定', onPress: () => { } },
      ]);
      return;
    }

    //如果图片没有上传成功，给出提示
    if (this.state.logo.loading || this.state.logo.error) {
      Alert.alert('', '图片上传中，请稍后...', [
        { text: '确定', onPress: () => { } },
      ]);
      return;
    }

    //这里组装需要提交的数据
    let submitData = {
      'nodeType': '设备',
      'parentId': this.props.objectId,//web端创建设备时的一个值
      'templateId': this.tplH.id,
      'createBy': userName,
      'updateBy': userName,
      'tenantId': 1,
      'treeType': 'fmhc',
      'iconKey': this.tplH.icon,
      'objectType': 'device',
      'isNew': true,
      'children': [],
      'numberOfLevel': 5,
      'fieldGroupEntityList': [
        {
          'fieldGroupId': this.tplH.id,
          'fieldValueEntityList': [
            {
              'fieldTemplateId': 51,
              'value': this.state.data.productName,
              'code': 'name',
            },
            {
              'fieldTemplateId': 52,
              'value': this.state.data.ProductNum,
              'code': 'code',
            },
            {
              'fieldTemplateId': 69,
              'value': JSON.stringify([{
                "key": this.state.logo.key,
                "name": this.state.logo.name
              }]),
              'code': 'logo',
            },
          ],
        },
      ],
      //以上是web端接口提取参数

      name: this.state.data.productName,
      code: this.state.data.ProductNum,
      paramsDetail: {
        Class: this.state.data[DeviceTplKey[0]],
        Type: this.state.data[DeviceTplKey[1]],
        Specification: this.state.data[DeviceTplKey[2]],
        LedgerParameters: this.state.groupData[1].options.map((p) => {
          let value = [];
          if (p.Value) {
            if (Array.isArray(p.Value)) value = p.Value;
            else {
              value = [p.Value];
            }
          }
          return {
            'ValueName': p.name,
            'InputType': p.inputType,
            'ValueText': value,
            'Unit': '',
          };
        }),
      },
    };

    let createData = {
      id: this.props.ticketId,//这里补上的是对应的盘点工单id
      assetName: this.state.data.productName,//这里补上的是用户输入的名称
      code: this.state.data.ProductNum,
      assetType: this.tplH.id,
      extensionProperties: {
        assetCode: this.state.data.ProductNum,//这里补上的是用户输入的编码
        assetLogo: JSON.stringify([{
          "key": this.state.logo.key,
          "name": this.state.logo.name
        }]),//这里使用用户上传的图片key
        assetPointCheckstate: 4,
        assetInitData: submitData
      },
      locationId: this.props.objectId,
      locationName: this.state.data.placeAt || '',
      locationType: this.props.objectType,
      userId: userId,
      userName: userName
    }

    console.log('submitData', submitData, createData, this.tplH);
    apiAddDeviceInitData(createData).then(ret => {
      console.log('create ret ', ret);
      if (isCodeOk(ret.code)) {
        //返回上层，调用提供的刷新
        this.props.onRefresh && this.props.onRefresh();
        this._doBack();
      } else {
        //给出报错提示
        Alert.alert('', ret.msg || '报错失败！', [
          { text: '确定', onPress: () => { } },
        ]);
      }
    })
  };

  render() {
    return (
      <View style={{ flex: 1, backgroundColor: '#F4F6F8' }}>
        <Toolbar
          title={'盘盈'}
          navIcon="back"
          onIconClicked={this._doBack}
          actions={[]}
          onActionSelected={[]}
        />
        <ScrollView style={{ flex: 1 }}>
          {this.state.groupData.map((group) => this._renderGroup(group))}
          {this._renderImage()}
        </ScrollView>
        <TouchableOpacity
          style={{
            marginHorizontal: 16,
            marginTop: 10,
            marginBottom: isPhoneX() ? 32 : 16,
            height: 44,
            backgroundColor: GREEN,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={this._doSubmit}
        >
          <Text style={{ fontSize: 17, color: '#fff' }}>{'保存'}</Text>
        </TouchableOpacity>
        {this._renderPickerDate()}
      </View>
    );
  }
}
