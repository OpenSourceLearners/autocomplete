## autocomplete（可输入下拉选择）

### 使用方法

#### 1、基于jQuery编写的插件，要引入jQuery库文件
```
<script src="js/jquery.js"></script>
```

#### 2、克隆git上代码
```
git clone https://github.com/OpenSourceLearners/autocomplete.git
```

#### 3、引入主要文件
```
<script src="js/autocomplete.js"></script>
<script src="css/autocomplete.css"></script>
```

#### 4、简单栗子
```
<input type="text" id="input" />

$('#input').autocomplete({
    data: ['a', 'b', 'c', { value: 'd', html: 'd1'}]
});
```

#### 5、参数说明：$('#input').autocomplete({options});
```
data: []                // 下拉渲染的数据，元素可以是字符串或者对象。
valueKey: 'value'       // 如果数据元素时对象时，取值的key
htmlKey: 'html'         // 如果数据元素时对象时，取显示内容的key
selectClass: ''         // 选择框添加class样式
render: null            // 渲染内容，可以是函数（function ({元素})），或者是模板表达式比如：('${value}-${html}')。
ajax: null              // 异步请求获取数据渲染
params: {}              // 请求参数
handleData: null        // 异步返回数据处理函数
// v1.0.2
filter: false,          // 开启过滤
filterFields: 'keyword',  // 过滤查询字段，ajax请求才有用
fill: 'value',          // 填充值，默认是value，或者是：html
immediate: true,        // 立即调用ajax获取数据
// v1.0.3
ajaxOptions: {},        // ajax请求配置项
handleSendData: null,   // 处理请求数据
```
#### 5、事件

  - selected
    - 事件名：选中事件
    - 参数：value(值),index(索引)
    
    
## 版本说明：
  - v1.0.1
    - 新增选中事件
  - v1.0.2
    - 实现过滤数据
    - 修复在未选中时上下键没有效果
  - v1.0.3
    - 扩展ajax请求配置项和数据处理