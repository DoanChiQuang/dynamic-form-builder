/**
 * form-schema-builder.js
 *
 * Standalone utility for programmatically generating Form Builder JSON schemas
 * compatible with the Dynamic Form Builder (tournament/form.phtml).
 *
 * Works in Node.js (CommonJS / ESM) and browser (script tag / AMD).
 *
 * Usage (Node.js):
 *   const { FormSchema, Input, Select, Radio, RadioOption, Checkbox, Text, HTML } = require('./form-schema-builder');
 *
 *   const schema = new FormSchema({ title: 'Đăng ký', key_name: 'srace', enabled: true });
 *   const box = schema.addBox('Thông tin cá nhân');
 *   box.addRow(Input({ label: 'Họ tên', name: 'full_name', required: true }));
 *   box.addRow(
 *     Select({ label: 'Cự ly', name: 'distance', options: [
 *       { label: '5km', value: '5k' },
 *       { label: '10km', value: '10k' }
 *     ]}),
 *     Input({ label: 'Mã giới thiệu', name: 'ref_code' })
 *   );
 *   console.log(schema.toString());
 *
 * Usage (browser):
 *   <script src="form-schema-builder.js"></script>
 *   var schema = new FormSchemaBuilder.FormSchema({ title: '...' });
 */

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.FormSchemaBuilder = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var _seq = 0;

    function _uid() {
        return 'c_' + Date.now() + '_' + (++_seq);
    }

    function _name() {
        return 'name_' + String(Date.now()).slice(-6) + String(++_seq).padStart(4, '0');
    }

    // Normalize options: string[] | {label,value?}[] → {label,value}[]
    function normalizeOptions(options) {
        return (options || []).map(function (o) {
            if (typeof o === 'string') return { label: o, value: o };
            return {
                label: String(o.label != null ? o.label : ''),
                value: String(o.value != null ? o.value : (o.label != null ? o.label : ''))
            };
        });
    }

    // ──────────────────────────────────────────────────────────────
    // Component factory functions
    // Each mirrors FormBuilderApp.getDefaults() + serializeComp()
    // ──────────────────────────────────────────────────────────────

    function Input(opts) {
        opts = opts || {};
        return {
            id: opts.id || _uid(),
            variant: 'Input',
            label: opts.label || 'New Input',
            name: opts.name || _name(),
            placeholder: opts.placeholder !== undefined ? opts.placeholder : 'Enter value',
            description: opts.description || '',
            required: !!opts.required,
            disabled: !!opts.disabled,
            value: opts.value || '',
            rowIndex: opts.rowIndex || 0
        };
    }

    function Checkbox(opts) {
        opts = opts || {};
        return {
            id: opts.id || _uid(),
            variant: 'Checkbox',
            label: opts.label || 'New Checkbox',
            name: opts.name || _name(),
            description: opts.description || '',
            required: !!opts.required,
            disabled: !!opts.disabled,
            checked: !!opts.checked,
            options: normalizeOptions(opts.options || [
                { label: 'Option 1', value: 'option_1' },
                { label: 'Option 2', value: 'option_2' }
            ]),
            rowIndex: opts.rowIndex || 0
        };
    }

    function Select(opts) {
        opts = opts || {};
        var obj = {
            id: opts.id || _uid(),
            variant: 'Select',
            label: opts.label || 'New Select',
            name: opts.name || _name(),
            placeholder: opts.placeholder !== undefined ? opts.placeholder : 'Select an option',
            description: opts.description || '',
            required: !!opts.required,
            disabled: !!opts.disabled,
            options: normalizeOptions(opts.options || [
                { label: 'Option 1', value: 'option_1' },
                { label: 'Option 2', value: 'option_2' }
            ]),
            rowIndex: opts.rowIndex || 0
        };
        if (opts.multiple) obj.multiple = true;
        if (opts.sourceId) obj.sourceId = String(opts.sourceId);
        return obj;
    }

    /**
     * RadioOption — helper for building radioOptions entries used in Radio({ radioType: 'component' })
     *
     * @param {object} opts
     * @param {string}   opts.label      - display label
     * @param {string}   opts.value      - stored value (defaults to label)
     * @param {Array}    opts.components - sub-components (Input/Select/… objects)
     */
    function RadioOption(opts) {
        opts = opts || {};
        return {
            label: opts.label || '',
            value: opts.value != null ? String(opts.value) : (opts.label || ''),
            components: opts.components || []
        };
    }

    /**
     * Radio component.
     *
     * radioType 'option' (default) — plain radio list, uses `options`.
     * radioType 'component'        — each option has sub-components, uses `radioOptions`.
     *
     * @param {object} opts
     * @param {string}       opts.radioType   - 'option' | 'component'
     * @param {Array}        opts.options      - used when radioType === 'option'
     * @param {Array}        opts.radioOptions - array of RadioOption objects; used when radioType === 'component'
     */
    function Radio(opts) {
        opts = opts || {};
        var radioType = opts.radioType === 'component' ? 'component' : 'option';
        var obj = {
            id: opts.id || _uid(),
            variant: 'Radio',
            label: opts.label || 'New Radio',
            name: opts.name || _name(),
            description: opts.description || '',
            required: !!opts.required,
            disabled: !!opts.disabled,
            checked: !!opts.checked,
            radioType: radioType,
            rowIndex: opts.rowIndex || 0
        };
        if (radioType === 'component') {
            obj.radioOptions = (opts.radioOptions || []).map(function (ro) {
                return {
                    label: ro.label || '',
                    value: ro.value != null ? String(ro.value) : (ro.label || ''),
                    components: (ro.components || []).map(function (sub) { return serializeComp(sub); })
                };
            });
        } else {
            obj.options = normalizeOptions(opts.options || [
                { label: 'Option 1', value: 'option_1' },
                { label: 'Option 2', value: 'option_2' }
            ]);
        }
        return obj;
    }

    function Text(opts) {
        opts = opts || {};
        return {
            id: opts.id || _uid(),
            variant: 'Text',
            label: opts.label || 'New Text',
            content: opts.content !== undefined ? opts.content : 'Text content',
            textType: opts.textType || 'p',
            rowIndex: opts.rowIndex || 0
        };
    }

    function HTML(opts) {
        opts = opts || {};
        return {
            id: opts.id || _uid(),
            variant: 'HTML',
            label: opts.label || 'New HTML',
            content: opts.content !== undefined ? opts.content : '<p>HTML content</p>',
            rowIndex: opts.rowIndex || 0
        };
    }

    // ──────────────────────────────────────────────────────────────
    // serializeComp — mirrors FormBuilderApp.serializeComp() exactly
    // Produces the final JSON-ready object for a single component.
    // ──────────────────────────────────────────────────────────────
    function serializeComp(comp) {
        var obj = {
            id: comp.id || _uid(),
            variant: comp.variant,
            label: comp.label,
            rowIndex: comp.rowIndex || 0
        };
        switch (comp.variant) {
            case 'Text':
                obj.content = comp.content || '';
                obj.textType = comp.textType || 'p';
                break;
            case 'HTML':
                obj.content = comp.content || '';
                break;
            case 'Input':
                obj.name = comp.name;
                obj.placeholder = comp.placeholder || '';
                obj.description = comp.description || '';
                obj.required = comp.required || false;
                obj.disabled = comp.disabled || false;
                obj.value = comp.value || '';
                break;
            case 'Checkbox':
                obj.name = comp.name;
                obj.description = comp.description || '';
                obj.required = comp.required || false;
                obj.disabled = comp.disabled || false;
                obj.checked = comp.checked || false;
                obj.options = comp.options || [];
                break;
            case 'Select':
                obj.name = comp.name;
                obj.placeholder = comp.placeholder || '';
                obj.description = comp.description || '';
                obj.required = comp.required || false;
                obj.disabled = comp.disabled || false;
                obj.options = comp.options || [];
                if (comp.multiple) obj.multiple = true;
                if (comp.sourceId) obj.sourceId = comp.sourceId;
                break;
            case 'Radio':
                obj.name = comp.name;
                obj.description = comp.description || '';
                obj.required = comp.required || false;
                obj.disabled = comp.disabled || false;
                obj.checked = comp.checked || false;
                obj.radioType = comp.radioType || 'option';
                if (comp.radioType === 'component' && comp.radioOptions) {
                    obj.radioOptions = comp.radioOptions.map(function (ro) {
                        return {
                            label: ro.label,
                            value: ro.value || '',
                            components: (ro.components || []).map(serializeComp)
                        };
                    });
                } else {
                    obj.options = comp.options || [];
                }
                break;
        }
        return obj;
    }

    // ──────────────────────────────────────────────────────────────
    // FormBox — mirrors a single box: { id, title, rows[] }
    // ──────────────────────────────────────────────────────────────

    /**
     * @param {object} opts
     * @param {string} opts.id
     * @param {string} opts.title
     */
    function FormBox(opts) {
        opts = opts || {};
        this.id = opts.id || ('box_' + (++_seq));
        this.title = opts.title || '';
        this._rows = [];
    }

    /**
     * Add a row to the box.
     * Pass one component for a single-column row.
     * Pass multiple components for a multi-column row.
     *
     * box.addRow(Input({...}));
     * box.addRow(Input({...}), Select({...}));
     *
     * @returns {FormBox} this (chainable)
     */
    FormBox.prototype.addRow = function () {
        var comps = Array.prototype.slice.call(arguments);
        if (comps.length === 0) return this;
        this._rows.push(comps.length === 1 ? comps[0] : comps);
        return this;
    };

    FormBox.prototype.toJSON = function () {
        var rows = this._rows.map(function (row, ri) {
            if (Array.isArray(row)) {
                return row.map(function (comp) {
                    comp.rowIndex = ri;
                    return serializeComp(comp);
                });
            }
            row.rowIndex = ri;
            return serializeComp(row);
        });
        return { id: this.id, title: this.title, rows: rows };
    };

    // ──────────────────────────────────────────────────────────────
    // FormSchema — top-level builder, mirrors FormBuilderApp.serialize()
    // ──────────────────────────────────────────────────────────────

    /**
     * @param {object} opts
     * @param {string}  opts.title
     * @param {string}  opts.key_name
     * @param {string}  opts.description
     * @param {boolean} opts.enabled    - defaults to true
     */
    function FormSchema(opts) {
        opts = opts || {};
        this.title = opts.title || '';
        this.key_name = opts.key_name || '';
        this.description = opts.description || '';
        this.enabled = opts.enabled !== false;
        this._boxes = [];
    }

    /**
     * Add a new box and return it for chaining.
     * @param {string} title
     * @returns {FormBox}
     */
    FormSchema.prototype.addBox = function (title) {
        var box = new FormBox({ title: title || '' });
        this._boxes.push(box);
        return box;
    };

    /**
     * Produce the plain JSON object identical to what FormBuilderApp.serialize() returns.
     */
    FormSchema.prototype.toJSON = function () {
        return {
            title: this.title,
            key_name: this.key_name,
            description: this.description,
            enabled: this.enabled,
            boxes: this._boxes.map(function (b) { return b.toJSON(); })
        };
    };

    /**
     * Produce a pretty-printed JSON string.
     */
    FormSchema.prototype.toString = function () {
        return JSON.stringify(this.toJSON(), null, 2);
    };

    // ──────────────────────────────────────────────────────────────
    // parse — load an existing JSON schema back into a FormSchema
    // ──────────────────────────────────────────────────────────────

    /**
     * Parse a saved JSON (from server) back into a FormSchema instance.
     * Handles all three legacy formats:
     *   1. { boxes, title, key_name, ... }   — current format
     *   2. { rows, title, ... }              — legacy single-box
     *   3. [row, row, ...]                   — raw rows array
     *
     * @param {object|Array} json
     * @returns {FormSchema}
     */
    function parse(json) {
        var meta = {};
        var rawBoxes = [];

        if (Array.isArray(json)) {
            rawBoxes = [{ id: 'box_1', title: '', rows: json }];
        } else if (json && Array.isArray(json.boxes)) {
            meta = json;
            rawBoxes = json.boxes;
        } else if (json && Array.isArray(json.rows)) {
            meta = json;
            rawBoxes = [{ id: 'box_1', title: '', rows: json.rows }];
        }

        var schema = new FormSchema({
            title: meta.title || '',
            key_name: meta.key_name || '',
            description: meta.description || '',
            enabled: meta.enabled !== false
        });

        rawBoxes.forEach(function (rb) {
            var box = new FormBox({ id: rb.id, title: rb.title || '' });
            (rb.rows || []).forEach(function (row) {
                if (Array.isArray(row)) {
                    box.addRow.apply(box, row.map(_migrateComp));
                } else {
                    box.addRow(_migrateComp(row));
                }
            });
            schema._boxes.push(box);
        });

        return schema;
    }

    function _migrateComp(comp) {
        if (!comp.id) comp.id = _uid();
        // string options → { label, value }
        if (Array.isArray(comp.options)) {
            comp.options = normalizeOptions(comp.options);
        }
        // radioOptions missing value → default to label
        if (Array.isArray(comp.radioOptions)) {
            comp.radioOptions = comp.radioOptions.map(function (ro) {
                return {
                    label: ro.label || '',
                    value: ro.value != null ? ro.value : (ro.label || ''),
                    components: (ro.components || []).map(_migrateComp)
                };
            });
        }
        return comp;
    }

    // ──────────────────────────────────────────────────────────────
    // Public API
    // ──────────────────────────────────────────────────────────────
    return {
        FormSchema: FormSchema,
        FormBox: FormBox,
        Input: Input,
        Checkbox: Checkbox,
        Select: Select,
        Radio: Radio,
        RadioOption: RadioOption,
        Text: Text,
        HTML: HTML,
        normalizeOptions: normalizeOptions,
        serializeComp: serializeComp,
        parse: parse
    };
});
