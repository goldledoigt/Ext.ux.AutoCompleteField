Ext.ns('Ext.ux');

/**
 * @xtype ux_autocompletefield
 * @author Revolunet
 */
Ext.ux.AutoCompleteField = Ext.extend(Ext.form.Text, {

    store: null,

    minChar: 3,

    maxResults: 50,

    filterField: null,

    listItemTpl: null,

    enableMultiSelect: false,

    monitorOrientation: true,

    emptyText: 'No result...',

    cls: 'ux_autocompletefield',

    bubbleTpl: '<div>{text}<span>x</span></div>',

    labelTpl: '<span>{label}<tpl if="count"><span> {count} {[values.count > 1 ? "items" : "item"]} selected</span></tpl></span>',

    initComponent: function() {
        this.store = Ext.StoreMgr.lookup(this.store);
        if (!this.store || !this.listItemTpl || !this.filterField) {
            throw 'Ext.ux.AutoCompleteField requires store, filterField and listItemTpl configurations to be defined.';
        } else {
            if (this.enableMultiSelect) {
                this.values = [];
                this.labelTpl = new Ext.XTemplate(this.labelTpl);
                this.renderTpl = [
                    '<tpl if="label">',
                        '<div class="x-form-label"><span>{label}</span></div>',
                    '</tpl>',
                    '<tpl if="fieldEl">',
                        '<div class="x-form-field-container">'+(!Ext.is.iPhone ? '<div class="{fieldCls}-selection"></div>' : '')+'<input id="{inputId}" type="{inputType}" name="{name}" class="{fieldCls}"',
                            '<tpl if="tabIndex">tabIndex="{tabIndex}" </tpl>',
                            '<tpl if="placeHolder">placeholder="{placeHolder}" </tpl>',
                            '<tpl if="style">style="{style}" </tpl>',
                            '<tpl if="maxlength">maxlength="{maxlength}" </tpl>',
                            '<tpl if="autoComplete">autocomplete="{autoComplete}" </tpl>',
                            '<tpl if="autoCapitalize">autocapitalize="{autoCapitalize}" </tpl>',
                            '<tpl if="autoCorrect">autocorrect="{autoCorrect}" </tpl> />'+(Ext.is.iPhone ? '<div class="{fieldCls}-selection"></div>' : ''),
                        '<tpl if="useMask"><div class="x-field-mask"></div></tpl>',
                        '</div>',
                        '<tpl if="useClearIcon"><div class="x-field-clear-container"><div class="x-field-clear x-hidden-visibility">&#215;</div></div></tpl>',
                    '</tpl>'
                ];
            }
            this.fieldValueTpl = new Ext.XTemplate(this.fieldValueTpl || this.listItemTpl, {compiled:true});
            Ext.ux.AutoCompleteField.superclass.initComponent.apply(this, arguments);
            this.on('orientationchange', this.handleOrientationChange, this);
            this.on('keyup', this.onFieldKeyUp, this);
        }
    },

    afterRender: function() {
        Ext.ux.AutoCompleteField.superclass.afterRender.apply(this, arguments);
        if (this.enableMultiSelect) {
            this.bubblesEl = this.el.down('.x-input-text-selection');
            this.el.on('tap', function(event, el) {
                this.removeBubble(Ext.getCmp(el.id));
            }, this, {delegate: 'div.x-component'});
        }
    },

    handleOrientationChange: function() {
        var panel = this.getFloatingPanel();
        if (this.orientationTimeout) clearTimeout(this.orientationTimeout);
        this.orientationTimeout = Ext.defer(function() {
            this.resizeFloatingPanel();
            if (panel.el && panel.isVisible()) {
                panel.showBy(this.el);
            }
        }, 50, this);
    },

    onFieldKeyUp: function(field, event) {
        if (this.keyUpTimeout) clearTimeout(this.keyUpTimeout);
        this.keyUpTimeout = Ext.defer(this.updateList, 1000, this);
        this.checkBubbleToRemove(event.browserEvent.keyCode);
    },

    checkBubbleToRemove: function(keyCode) {
        if (this.enableMultiSelect && keyCode === 8 && this.valueLength === 0) {
            if (this.lastBubbleSelected) {
                this.removeBubble(Ext.getCmp(this.lastBubbleSelected.id));
                this.lastBubbleSelected = false;
            } else {
                var lastBubble = this.bubblesEl.last();
                if (lastBubble) {
                    this.lastBubbleSelected = lastBubble;
                    this.selectBubble(lastBubble);
                }
            }
        } else if (this.lastBubbleSelected && keyCode !== 8) {
            this.unselectBubble(this.lastBubbleSelected);
            this.lastBubbleSelected = false;
        }
        this.valueLength = this.getRawValue().length;
    },

    updateList: function() {
        var query = this.getRawValue(),
            panel = this.getFloatingPanel(),
            list = panel.items.get(0),
            store = list.store,
            l = query.length;

        if (l >= this.minChar) {
            store.removeAll();
            var records = this.getRecords(query, this.maxResults);
            store.loadRecords(records);
            if (list.el) list.el.unmask();
            panel.showBy(this.el);
            list.scroller.scrollTo({x: 0, y: 0});
            if (!store.getCount()) {
                list.el.mask(this.emptyText);
            }
        } else {
            panel.hide();
        }
    },

    getFloatingPanel: function() {
        if (!this.floatingPanel) {
            this.floatingPanel = new Ext.Panel({
                floating: true,
                layout: 'fit',
                width: 290,
                height: 200,
                // height: Ext.is.iPhone ? 50 : 200,
                cls: 'ux_autocompletefield_list',
                items: [{
                    xtype: 'list',
                    store: [],
                    itemTpl: this.listItemTpl,
                    listeners: {
                        scope: this,
                        itemtap: this.onListItemSelect
                    }
                }],
                listeners: {
                    scope: this,
                    hide: this.floatingPanelHide,
                    show: this.floatingPanelShow
                }
            });
        }
        return this.floatingPanel;
    },

    floatingPanelShow: function(panel) {
        this.resizeFloatingPanel();
    },

    floatingPanelHide: function() {
        if (this.enableMultiSelect) {
            this.setValue('');
            this.valueLength = 0;
        }
    },

    resizeFloatingPanel: function() {
        var panel = this.getFloatingPanel();
        panel.setWidth(this.getWidth());
    },

    updateLabel: function() {
        if (this.labelEl) {
            this.labelTpl.overwrite(this.labelEl, {
                label: this.label,
                count: this.values.length
            });
        }
    },

    addValue: function(value) {
        this.values.push(value);
        this.updateLabel();
    },

    removeValue: function(value) {
        var index = this.values.indexOf(value);
        if (index !== -1) this.values.splice(index, 1);
        if (this.values.length > 1) {
            this.createBubble(this.values[this.values.length - 2], 0, true);
        }
        this.updateLabel();
    },

    addBubble: function(value) {
        var bubble, handler,
            items = this.bubblesEl.select('.x-component');

        if (items.getCount() === 2) {
            Ext.getCmp(items.first().id).destroy();
        }
        this.addValue(value);
        this.createBubble(value);
    },

    createBubble: function(value, position, skipAnimation) {
        var bubble = new Ext.Component({
            value: value,
            style: {opacity: skipAnimation ? 1 : 0},
            renderTpl: this.bubbleTpl,
            renderData: {text: Ext.util.Format.ellipsis(value, 10)}
        }).render(this.bubblesEl, position);
        if (!skipAnimation) {
            Ext.Anim.run(bubble.el, 'fade', {
                out: false,
                duration: 500,
                autoClear: true
            });
        }
    },

    removeBubble: function(bubble) {
        var value = bubble.value;
        this.selectBubble(bubble.el);
        Ext.Anim.run(bubble.el, 'fade', {
            out: true,
            scope: this,
            duration: 500,
            autoClear: false,
            after: function() {
                bubble.destroy();
                this.removeValue(value);
            }
        });
    },

    onListItemSelect: function(list, index, item, event) {
        var record = list.store.getAt(index);
        if (record) {
            var value = this.fieldValueTpl.apply(record.data);
            if (this.enableMultiSelect) {
                this.addBubble(this.stripTags(value));
                this.setValue('');
                this.valueLength = 0;
            } else {
                this.setValue(this.stripTags(value));
            }
        }
        this.hidePanel();
    },

    stripTags: function(v) {
        return !v ? v : String(v).replace(/<\/?[^>]+>/gi, '');
    },

    hidePanel: function() {
        this.getFloatingPanel().hide();
    },

    getRawValue: function() {
        return Ext.ux.AutoCompleteField.superclass.getValue.call(this);
    },

    getValue: function() {
        if (this.enableMultiSelect) {
            return this.values;
        } else {
            return this.getRawValue();
        }
    },

    getRecords: function(query, limit) {
        this.store.clearFilter();
        this.store.filter(this.filterField, query);
        return this.store.getRange(0, limit-1);
    },

    selectBubble: function(bubbleEl) {
        bubbleEl.addCls('selected');
    },

    unselectBubble: function(bubbleEl) {
        bubbleEl.removeCls('selected');
    }

});

Ext.reg('ux_autocompletefield', Ext.ux.AutoCompleteField);
