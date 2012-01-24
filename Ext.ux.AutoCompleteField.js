Ext.ns('Ext.ux');

/**
 * @xtype ux_autocompletefield
 * @author Revolunet
 */
Ext.ux.AutoCompleteField = Ext.extend(Ext.form.Text, {

    data: null,

    store: null,

    minChar: 2,

    maxResults: 50,

    filterField: null,

    listItemTpl: null,

    monitorOrientation: true,

    cls: 'ux_autocompletefield',

    renderTpl: [
        '<tpl if="label">',
            '<div class="x-form-label"><span>{label}</span></div>',
        '</tpl>',
        '<tpl if="fieldEl">',
            '<div class="x-form-field-container"><div class="{fieldCls}-selection"></div><input id="{inputId}" type="{inputType}" name="{name}" class="{fieldCls}"',
                '<tpl if="tabIndex">tabIndex="{tabIndex}" </tpl>',
                '<tpl if="placeHolder">placeholder="{placeHolder}" </tpl>',
                '<tpl if="style">style="{style}" </tpl>',
                '<tpl if="maxlength">maxlength="{maxlength}" </tpl>',
                '<tpl if="autoComplete">autocomplete="{autoComplete}" </tpl>',
                '<tpl if="autoCapitalize">autocapitalize="{autoCapitalize}" </tpl>',
                '<tpl if="autoCorrect">autocorrect="{autoCorrect}" </tpl> />',
            '<tpl if="useMask"><div class="x-field-mask"></div></tpl>',
            '</div>',
            '<tpl if="useClearIcon"><div class="x-field-clear-container"><div class="x-field-clear x-hidden-visibility">&#215;</div></div></tpl>',
        '</tpl>'
    ],

    initComponent: function() {
        this.store = Ext.StoreMgr.lookup(this.store);
        if (!this.store || !this.listItemTpl || !this.filterField) {
            throw 'Ext.ux.AutoCompleteField requires store, filterField and listItemTpl configurations to be defined.';
        } else {
            this.fieldValueTpl = new Ext.XTemplate(this.fieldValueTpl || this.listItemTpl, {compiled:true});
            Ext.ux.AutoCompleteField.superclass.initComponent.apply(this, arguments);
            this.on('orientationchange', this.handleOrientationChange, this);
            this.on('keyup', this.onFieldKeyUp, this);
        }
    },

    handleOrientationChange: function() {
        var panel = this.getFloatingPanel();
        console.log("handleOrientationChange", this, arguments, panel.isVisible(), panel.el);
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
        this.keyUpTimeout = Ext.defer(this.updateList, 500, this);
    },

    updateList: function() {
        var query = this.getValue(true),
            panel = this.getFloatingPanel(),
            list = panel.items.get(0),
            store = this.store,
            l = query.length;

        if (l >= this.minChar) {
            store.clearFilter();
            store.filter(this.filterField, query);
            if (store.getCount()) {
                list.store.loadRecords(store.getRange());
                panel.showBy(this.el);
                list.scroller.scrollTo({x: 0, y: 0});
            } else panel.hide();
        } else panel.hide();
    },

    getFloatingPanel: function() {
        if (!this.floatingPanel) {
            this.floatingPanel = new Ext.Panel({
                floating: true,
                layout: 'fit',
                width: 290,
                height: 200,
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
                    show: this.floatingPanelShow
                }
            });
        }
        return this.floatingPanel;
    },

    floatingPanelShow: function(panel) {
        this.resizeFloatingPanel();
    },

    resizeFloatingPanel: function() {
        var panel = this.getFloatingPanel();
        panel.setWidth(this.getWidth());
    },

    addBubble: function(value) {
        console.log('addBubble', this, arguments);
        var c = new Ext.Component({
            renderTpl: '<div>' + value + '<span>x</span></div>'
        });
        c.render(this.el.down('.x-input-text-selection'));
    },

    onListItemSelect: function(list, index, item, event) {
        var record = list.store.getAt(index);
        if (record) {
            var value = this.fieldValueTpl.apply(record.data);
            this.addBubble(Ext.util.Format.ellipsis(this.stripTags(value), 10));
            this.setValue('');
        }
        this.hidePanel();
    },

    stripTags: function(v) {
        return !v ? v : String(v).replace(/<\/?[^>]+>/gi, '');
    },

    hidePanel: function() {
        this.getFloatingPanel().hide();
    },

    getValue: function(skipStoreValue) {
        console.log("getValue", this, arguments);
        var panel = this.getFloatingPanel(),
            list = panel.items.get(0),
            store = list.store,
            value = Ext.ux.AutoCompleteField.superclass.getValue.apply(this, arguments);

        if (!skipStoreValue && value) {
            var recordIndex = store.find(this.filterField, value);
            if (recordIndex >= 0) {
                var record = store.getAt(recordIndex);
                this.name = record.get('param');
                value = record.get('value');
            }
        }
        return value;
    }

});

Ext.reg('ux_autocompletefield', Ext.ux.AutoCompleteField);
