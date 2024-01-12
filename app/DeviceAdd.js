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
import CacheImage from "./CacheImage";
import {getInterfaceLanguage, getLanguage, localStr} from "./utils/Localizations/localization";
import Colors from "../../../app/utils/const/Colors";
import SndAlert from "../../../app/utils/components/SndAlert";
const DataGroup = () => [
  {
    groupName: localStr('lang_add_device_group_basic'),
    items: [
      { key: 'productName', name: localStr('lang_add_device_basic_name'), input: true },
      { key: 'ProductNum', name: localStr('lang_add_device_basic_num'), input: true },
      { key: 'placeAt', name: localStr('lang_add_device_basic_place'), onRead: true },
    ],
  },
  {
    groupName: localStr('lang_add_device_group_params'),
    items: [
      { key: 'deviceClass', name: localStr('lang_add_device_params_class'), select: true },
      { key: 'deviceType', name: localStr('lang_add_device_params_type'), select: true },
      { key: 'deviceModel', name: localStr('lang_add_device_params_model'), select: true },
    ],
    options: [],
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
    if (props.device) this._processEditData(props.device)
    this.tplData = [];
  }

  _processEditData(device) {
    let basicData = this.state.data;
    let initData = device.extensionProperties.assetInitData;
    basicData.productName = initData.name;
    basicData.ProductNum = initData.code;
    basicData.deviceClass = initData.paramsDetail.Class;
    basicData.deviceType = initData.paramsDetail.Type;
    basicData.deviceModel = initData.paramsDetail.Specification;
    //还有logo
    let findLogo = initData?.fieldGroupEntityList[0]?.fieldValueEntityList?.find(f => f.code === 'logo');
    if (findLogo) {
      this.state.logo = JSON.parse(findLogo.value)[0];
    }

    let options = initData.paramsDetail.LedgerParameters.map(v => {
      return {
        isOptions: true,
        key: v.ValueName,
        name: v.ValueName,
        option: true,
        Value: v.ValueText.join(','),
        inputType: v.InputType,
        date: v.ValueName.includes('日期'), //,
        select: v.InputType !== 0,
        multi: v.InputType === 1,
        data: null//v.ValueText,
      };
    })
    this.state.groupData[1].options = options;
  }

  _setParamMenu() {
    let values = this.tplData
      .find((item) => item.Class === this.state.data[DeviceTplKey[0]])
      .Children.find((item) => item.Type === this.state.data[DeviceTplKey[1]])
      .Children.find((item) => item.Specification === this.state.data[DeviceTplKey[2]]).Values;
    let options = this.state.groupData[1].options;
    options.forEach(op => {
      let find = values.find(v => op.name === v.ValueName);
      if (find) op.data = find.ValueText;
    });
    this.setState({});
  }

  componentDidMount() {
    //spid固定70
    apiTplTree('70').then((data) => {
      if (isCodeOk(data.Code)) {
        this.tplData = data.Data;
        //这里给赋值
        if (this.props.device) this._setParamMenu(this.tplData)
      } else {
        SndAlert.alert( data.Msg || localStr('lang_add_device_api_tpl_error'), '', [
          { text: localStr('lang_ticket_filter_ok'), onPress: () => { } },
        ]);
      }
      console.log('tpl tree', data);
    });

    apiHierarchyTpl().then(data => {
      console.log('hierarchyTpl', data);
      if (isCodeOk(data.Code)) {
        this.tplH = data.Data.datas.find(item => item.name === '设备');
      } else {
        SndAlert.alert( data.Msg || localStr('lang_add_device_api2_tpl_error'),'', [
          { text: localStr('lang_ticket_filter_ok'), onPress: () => { } },
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
          borderTopColor: Colors.seBorderSplit,
        }}>
        <Text style={{ color: Colors.seTextPrimary, fontSize: 15 }}>{row.name}</Text>
        {!row.option ? null : (
          <Text style={{ color: Colors.seTextDisabled, fontSize: 15, marginLeft: 6 }}>
            {localStr('lang_add_device_options')}
          </Text>
        )}
        <View style={{ flex: 1 }} />
        <TextInput
          numberOfLines={1}
          style={{
            fontSize: 15,
            paddingVertical: 0,
            color: Colors.seTextPrimary,
            marginRight: 6,
          }}
          textAlign='right'
          value={value}
          placeholder={localStr('lang_ticket_filter_input')}
          editable={!row.readOnly}
          placeholderTextColor={Colors.seTextDisabled}
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

    this.props.navigation.push('PageWarpper',{
      id: 'device_add',
      component: SingleSelect,
      passProps: {
        title: `${localStr('lang_add_device_row_select')}${row.name}`,
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
    let color = Colors.seTextDisabled;
    if (row.isOptions) {
      value = row.Value;
      if (Array.isArray(value)) {
        value = value.join(',');
      }
      if (value) {
        color = Colors.seTextSecondary;
      } else {
        value = localStr('lang_add_device_row_select');
      }
    } else {
      value = this.state.data[row.key];
      if (value) {
        color = Colors.seTextSecondary;
      } else {
        value = localStr('lang_add_device_row_select');
      }
    }
    return (
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          borderTopWidth: 1,
          borderTopColor: Colors.seBorderSplit,
        }}
        onPress={() => this._clickSelect(row)}
      >
        <Text style={{ color: Colors.seTextPrimary, fontSize: 15 }}>{row.name}</Text>
        {!row.option ? null : (
          <Text style={{ color: Colors.seTextDisabled, fontSize: 15, marginLeft: 6 }}>
            {localStr('lang_add_device_options')}
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
        <Icon type={'arrow_right'} color={Colors.seTextDisabled} size={14} />
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
      <DateTimePicker locale={getLanguage()}
        is24Hour={true}
        titleIOS={localStr('lang_ticket_filter_select_date')}
        headerTextIOS={localStr('lang_ticket_filter_select_date')}
        titleStyle={{ fontSize: 17, color: '#333' }}
        cancelTextIOS={localStr("lang_ticket_filter_cancel")}
        confirmTextIOS={localStr('lang_ticket_filter_ok')}
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
    this.props.navigation.push('PageWarpper',{
      id: 'imagePicker',
      component: ImagePicker,
      passProps: {
        max: 1,
        onBack: () => this.props.navigation.pop(),
        done: (data) => {
          this.props.navigation.pop();
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
        // <Image
        //   source={{ uri: this.state.logo.uri }}
        //   style={{ width: 78, height: 78 }}
        // />
        <CacheImage borderWidth={1} imageKey={this.state.logo.key}
          defaultImgPath={{ uri: this.state.logo.uri }}
          width={78} height={78} />
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
          backgroundColor: Colors.seBgContainer,
          margin: 16,
          marginBottom: 20,
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
            borderBottomColor: Colors.seBorderSplit,
          }}
        >
          <Text style={{ fontSize: 15, color: Colors.seTextTitle }}>{localStr('lang_add_device_group_photo')}</Text>
        </View>
        <TouchableOpacity
          style={{
            borderWidth: 1,
            borderColor: Colors.seBorderSplit,
            marginTop: 12,
            alignItems: 'center',
            justifyContent: 'center',
            width: 80,
            height: 80,
          }}
          onPress={this._openImagePicker}
        >
          {child ? child : <Icon type="icon_add" size={36} color={Colors.seTextTitle} />}
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
          backgroundColor: Colors.seBgContainer,
          margin: 16,
          marginBottom: 0,
          padding: 16,
          borderRadius: 12,
        }}
      >
        <Text style={{ fontSize: 15, color: Colors.seTextTitle, marginBottom: 10 }}>
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

  _doBack = () => this.props.navigation.pop();

  _doSubmit = () => {

    //资产名称、编号、总称、类型、型号都不能为空
    let find = Object.keys(this.state.data).find((key) => {
      let value = this.state.data[key];
      if (!value) return true;
    });
    if (find || !this.state.logo) {
      SndAlert.alert( localStr('lang_add_device_submit_valid'), '', [
        { text: localStr('lang_ticket_filter_ok'), onPress: () => { } },
      ]);
      return;
    }

    //如果图片没有上传成功，给出提示
    if (this.state.logo.loading || this.state.logo.error) {
      SndAlert.alert(localStr('lang_add_device_image_uploading'), '', [
        { text: localStr('lang_ticket_filter_ok'), onPress: () => { } },
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
        assetPointCheckState: 4,
        assetInitData: submitData
      },
      locationId: this.props.objectId,
      locationName: this.state.data.placeAt || '',
      locationType: this.props.objectType,
      userId: userId,
      userName: userName
    }
    let isEdit = false;
    if (this.props.device) {
      //如果是编辑，那么传递assetId参数，避免当做新增处理
      createData.assetId = this.props.device.assetId;
      isEdit = true;
      // submitData.isNew = false;
    }

    console.log('submitData', submitData, createData, this.tplH);
    apiAddDeviceInitData(createData, isEdit).then(ret => {
      if (isCodeOk(ret.code)) {
        //返回上层，调用提供的刷新
        this.props.onRefresh && this.props.onRefresh();
        this._doBack();
      } else {
        //给出报错提示
        SndAlert.alert(ret.msg || localStr("lang_add_device_api_submit_error"), '', [
          { text: localStr("lang_ticket_filter_ok"), onPress: () => { } },
        ]);
      }
    })
  };

  render() {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.seBgLayout}}>
        <Toolbar
          title={localStr('lang_add_device_title')}
          navIcon="back"
          color={Colors.seBrandNomarl}
          borderColor={Colors.seBrandNomarl}
          onIconClicked={this._doBack}
          actions={[]}
          onActionSelected={[]}
        />
        <ScrollView style={{ flex: 1 }}>
          {this.state.groupData.map((group) => this._renderGroup(group))}
          {this._renderImage()}
        </ScrollView>
        <View style={{ backgroundColor: Colors.seBgContainer, padding: 16, paddingTop: 12, paddingBottom: isPhoneX() ? 32 : 16, }}>
          <TouchableOpacity
            style={{
              height: 40,
              backgroundColor: Colors.seBrandNomarl,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={this._doSubmit}
          >
            <Text style={{ fontSize: 17, color: Colors.seTextInverse }}>{localStr("lang_add_device_submit_button")}</Text>
          </TouchableOpacity>
        </View>

        {this._renderPickerDate()}
      </View>
    );
  }
}
