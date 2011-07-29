Ext.ns('Ext.ux');

Ext.ux.AutoCompleteField = Ext.extend(Ext.form.Text, {

    store: null,

    filterField: null,

    listItemTpl: null,

    monitorOrientation: true,

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
        if (this.orientationTimeout) clearTimeout(this.orientationTimeout);
        this.orientationTimeout = Ext.defer(this.resizeFloatingPanel, 50, this, [panel]);
    },

    onFieldKeyUp: function(field, event) {
        if (this.keyUpTimeout) clearTimeout(this.keyUpTimeout);
        this.keyUpTimeout = Ext.defer(this.updateList, 500, this);
    },

    updateList: function() {
        var query = this.getValue(),
            panel = this.getFloatingPanel(),
            list = panel.items.get(0),
            store = list.store;
        if (query.length) {
            var t = new Date();
            store.clearFilter(true);
            store.filter(this.filterField, query);
            document.location.hash = (new Date()) - t;
            if (store.getCount())
                panel.showBy(this.el);
            else panel.hide();
        } else panel.hide();
    },

    getFloatingPanel: function() {
        if (!this.floatingPanel) {
            this.floatingPanel = new Ext.Panel({
                floating: true,
                layout: 'fit',
                width: 290,
                height: 200,
                items: [{
                    xtype: 'list',
                    store: this.store,
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
        this.resizeFloatingPanel(panel);
    },

    resizeFloatingPanel: function(panel) {
        panel.setWidth(this.getWidth());
    },

    onListItemSelect: function(list, index, item, event) {
        var panel = this.getFloatingPanel(),
            record = list.store.getAt(index);
        if (record) {
            var value = this.fieldValueTpl.apply(record.data);
            this.setValue(this.stripTags(value));
        }
        panel.hide();
    },

    stripTags: function(v) {
        return !v ? v : String(v).replace(/<\/?[^>]+>/gi, '');
    }

});

Ext.reg('autocompletefield', Ext.ux.AutoCompleteField);