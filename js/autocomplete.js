/**===================================================
 * 输入下拉插件
 * @author xiaoming<2389640655@qq.com>
 * @version 1.0.1
 * ===================================================
 */
;(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // CommonJS
        module.exports = factory(require('jquery'));
    } else {
        // 全局变量
        root.returnExports = factory(jQuery);
    }
})(this, function ($) {
    // 唯一标识符
    var uniqueIdentifier = '__autocomplete__';
    // 判断是否安装此插件
    if ($.fn.autocomplete && $.fn.autocomplete._name && $.fn.autocomplete._name === uniqueIdentifier) return

    /********* 工具方法 *********/
    /**
     * 深拷贝
     * @param data
     * @returns {*}
     */
    function deepCopy (data) {
        if (typeof data !== 'object') return data
        var newData = $.isArray(data) ? [] : {}
        for (var key in data) {
            newData[key] = typeof data[key] === 'object' ? deepCopy(data[key]) : data[key]
        }
        return newData
    }

    /**
     * 抖函数
     * @param idle
     * @param action
     * @returns {Function}
     */
    var debounce = function (idle, action) {
        var last
        return function(){
            var ctx = this, args = arguments
            clearTimeout(last)
            last = setTimeout(function(){
                action.apply(ctx, args)
            }, idle)
        }
    }

    /**
     * 字符串模板
     * @param template
     * @param data
     */
    function stringTemplate (template, data) {
        if (!template || !data || typeof data !== 'object') return template;
        $.each(data, function (key, value) {
            template = template.replace('${'+ key +'}', value);
        });
        return template;
    }

    /*********** 构造对象 **********/
    function Autocomplete (el, options) {
        this.setOptions(options);
        this.$element = $(el);
        this.$select = null;
        this._data = options.data || [];
        this.lock = false;
        this.selectedIndex = -1;
        // 判断是否有ajax请求地址
        if (typeof options.ajax === 'string') {
            this.ajaxRenderOptions();
        } else {
            this.renderOptions();
            this.bindEvent();
        }
    }

    // 默认配置
    Autocomplete.DEFAULTOPTIONS = {
        valueKey: 'value',
        htmlKey: 'html',
        selectClass: '',
        render: null,
        ajax: null,
        handleData: null,
        params: {}
    }

    Autocomplete.prototype.version = 'v1.0.1';

    /**
     * 设置配置
     * @param options
     */
    Autocomplete.prototype.setOptions = function (options) {
        this.options = options;
        this.htmlKey = options.htmlKey || 'html';
        this.valueKey = options.valueKey || 'value';
        !$.isArray(this.options.selectClass) && (this.options.selectClass = [this.options.selectClass]);
        this.options.selectClass.push('autocomplete');
    }

    /**
     * 调用接口数据渲染
     */
    Autocomplete.prototype.ajaxRenderOptions = function () {
        var that = this;
        $.getJSON(this.options.ajax, this.options.params).then(function (res) {
            // 处理返回的数据
            typeof that.options.handleData === 'function' && (res = that.options.handleData(res));
            res = res || {};
            res.data = res.data || [];
            that._data = res.data;
            that.renderOptions();
            that.bindEvent();
        });
    }

    /**
     * 生成下拉
     */
    Autocomplete.prototype.renderOptions = function () {
        // var html = ['<ul>'];
        // var that = this;
        // var render = this.options.render;
        // $.each(this._data, function (i, item) {
        //     var type = typeof item;
        //     html.push('<li data-value="'+ (type === 'object' ? item[that.valueKey] : item) +'">');
        //     if (typeof render === 'function') {
        //         html.push(that.options.render(item));
        //     } else if (typeof render === 'string') {
        //         html.push(stringTemplate(render, item));
        //     } else {
        //         html.push(type === 'object' ? item[that.htmlKey] : item);
        //     }
        //     html.push('</li>');
        // });
        // html.push('</ul>');
        // this.$select = $(html.join('')).addClass(this.options.selectClass.join(' '));
        var $select = $('<ul></ul>');
        var that = this;
        var render = this.options.render;
        $.each(this._data, function (i, item) {
            var type = typeof item;
            var label = type === 'object' ? item[that.htmlKey] : item;
            if (typeof render === 'function') {
                label = render(item);
            } else if (typeof render === 'string') {
                label = stringTemplate(render, item);
            }
            var $li = $('<li data-value="'+ (type === 'object' ? item[that.valueKey] : item) +'">'+ label +'</li>');
            $li.data('data', item);
            $select.append($li);
        })
        this.$select = $select.addClass(this.options.selectClass.join(' '));
        $('body').append(this.$select);
    }

    /**
     * 事件绑定
     */
    Autocomplete.prototype.bindEvent = function () {
        // var that = this;
        this.$element.on('focus.show', $.proxy(this.onShowSelect, this));
        this.$element.on('blur.hide', $.proxy(this.onHideSelect, this));
        this.$element.on('keyup.instruct', $.proxy(this.onInstruct, this));
        this.$select.on('mousedown.fill', 'li', $.proxy(this.onFill, this));
        this.$select.on('mouseup.fill', 'li', $.proxy(this.onFill, this));
        this.$select.on('mousemove.hover', 'li', debounce(7, $.proxy(this.onHover, this)));
    }

    /**
     * 显示下拉选项
     * @param event
     */
    Autocomplete.prototype.onShowSelect = function (event, lock) {
        var offset = this.$element.offset();
        var css = {
            width: this.$element.outerWidth(true),
            top: offset.top + this.$element.outerHeight(true),
            left: offset.left
        };
        this.$select.css(css).addClass('is-show');
        // var $active = $('li:contains('+ this.$element.val() +')', this.$select);
        // this.selected($active.length && this.$element.val() ? $active : $('li:first', this.$select));
        if (!lock) this.selected(this.$select.find('li:eq('+ this.selectedIndex +')'));
        // lock || this.selected($('li:first', this.$select));
    }

    /**
     * 隐藏下拉选项
     * @param event
     */
    Autocomplete.prototype.onHideSelect = function (event) {
        if (this.lock) return;
        this.$select.removeClass('is-show');
    }

    /**
     * 选中填充值
     * @param event
     */
    Autocomplete.prototype.onFill = function (event) {
        var $this = $(event.currentTarget);
        if (event.type === 'mousedown') {
            this.$element.trigger('focus.show', true);
        } else if (event.type === 'mouseup') {
            this.setSelectionIndex($this.index())
            this.$element.val($this.attr('data-value'));
            this.$element.trigger('blur.hide');
        }
        event.preventDefault();
    }

    /**
     * 上下选择
     * @param event
     */
    Autocomplete.prototype.onInstruct = function (event) {
        var keyCodes = [13, 27, 38, 40]
        if ($.inArray(event.keyCode, keyCodes) === -1 && this.$element.hasClass('is-show')) return;
        var $active = $('li.active', this.$select);
        switch (event.keyCode) {
            case 13:
                this.setSelectionIndex($active.index());
                this.$element.val($active.attr('data-value'));
            case 27:
                this.$element.trigger('blur.hide');
                break;
            case 38:
                var $prev = $active.prev();
                $prev.length && this.selected($prev);
                break;
            case 40:
                var $next = $active.next();
                $next.length && this.selected($next);
                break;
        }
    }

    /**
     * 销毁
     */
    Autocomplete.prototype.destroy = function () {
        this.$select.remove();
        this.$element.off('focus.show');
        this.$element.off('blur.hide');
        this.$element.off('keyup.instruct');
    }

    /**
     * 选中option
     * @param el
     */
    Autocomplete.prototype.selected = function (el) {
        $('li.active', this.$select).removeClass('active');
        $(el).addClass('active');
    }

    /**
     * 经过选中
     * @param event
     */
    Autocomplete.prototype.onHover = function (event) {
        this.selected(event.currentTarget);
    }

    /**
     * 获取选中索引
     * 默认未选中: -1
     * @returns {number|*}
     */
    Autocomplete.prototype.getSelectedIndex = function () {
        return this.selectedIndex;
    }

    /**
     * 设置选中索引
     * @param selectedIndex
     */
    Autocomplete.prototype.setSelectionIndex = function (selectedIndex) {
        if (this.selectedIndex == selectedIndex) return
        if (selectedIndex < -1) selectedIndex = -1;
        this.selectedIndex = selectedIndex;
        var $active = this.$select.find('li:eq('+ this.selectedIndex +')');
        this.selected($active);
        this.$element.trigger('selected', [$active.data('data'), selectedIndex]);    // 触发事件
    }

    /*********** 扩展方法 *************/
    // 继承输入下拉方法
    function autocomplete (options, param) {
        // 初始化配置
        if (typeof options === 'object') {
            options = $.extend({}, Autocomplete.DEFAULTOPTIONS, options);
            this.each(function (index, el) {
                if (this._autocomplete) {
                    this._autocomplete.destroy();
                    this._autocomplete = null;
                }
                this._autocomplete = new Autocomplete(el, options);
            })
        } else if (typeof options === 'string') {
            this.each(function (index, el) {
                this.autocomplete && typeof this.autocomplete[options] === 'function' && this.autocomplete[options](param);
            })
        } else {
            throw new Error('输入下拉插件：参数错误');
        }
        // 支持链式调用
        return this;
    }
    // 用于识别同名不同插件
    autocomplete._name = uniqueIdentifier;
    // 判断插件冲突
    var old = $.fn.autocomplete
    if($.fn.autocomplete) {
        autocomplete.noConflict = function () {
            return old;
        }
    }
    $.fn.autocomplete = autocomplete;
});
