(function ($, window) {
    'use strict';

    var THEMES = {
        bootstrap3: {
            formGroup: 'form-group',
            formLabel: 'form-label',
            formControl: 'form-control',
            inputWrapper: 'input-field',
            hasError: 'has-error',
            hasSuccess: 'has-success',
            isInvalid: 'is-invalid',
            helpText: 'help-block text-danger',
            requiredMark: 'required',
            row: 'row',
            col: function (n) { return 'col-md-' + n; },
            checkboxWrapper: 'checkbox',
            radioWrapper: 'radio',
            checkboxLabel: null,
            radioLabel: null,
            checkboxInput: null,
            radioInput: null
        },
        bootstrap4: {
            formGroup: 'form-group mb-3',
            formLabel: 'form-label',
            formControl: 'form-control',
            inputWrapper: null,
            hasError: 'has-error',
            hasSuccess: '',
            isInvalid: 'is-invalid',
            helpText: 'form-text text-danger',
            requiredMark: 'text-danger',
            row: 'form-row',
            col: function (n) { return 'col-md-' + n; },
            checkboxWrapper: 'form-check',
            radioWrapper: 'form-check',
            checkboxLabel: 'form-check-label',
            radioLabel: 'form-check-label',
            checkboxInput: 'form-check-input',
            radioInput: 'form-check-input'
        },
        bootstrap5: {
            formGroup: 'mb-3',
            formLabel: 'form-label',
            formControl: 'form-control',
            inputWrapper: null,
            hasError: 'has-error',
            hasSuccess: '',
            isInvalid: 'is-invalid',
            helpText: 'form-text text-danger',
            requiredMark: 'text-danger',
            row: 'row',
            col: function (n) { return 'col-md-' + n; },
            checkboxWrapper: 'form-check',
            radioWrapper: 'form-check',
            checkboxLabel: 'form-check-label',
            radioLabel: 'form-check-label',
            checkboxInput: 'form-check-input',
            radioInput: 'form-check-input'
        }
    };

    var FormRenderer = function (options) {
        if (!options || !options.container || !options.data) {
            throw new Error('FormRenderer requires container and data options');
        }
        this._container = $(options.container);
        this._data = options.data || [];
        this._onChange = options.onChange || null;
        this._loadOptions = options.loadOptions || null;
        this._onSubmit = options.onSubmit || null;
        this._submitBtn = options.submitBtn || null;
        this._bound = {};
        this._rendered = false;

        var baseTheme = THEMES[options.theme] || THEMES.bootstrap3;
        this._classes = $.extend({}, baseTheme, options.classes || {});
    };

    FormRenderer.prototype = {
        constructor: FormRenderer,

        render: function () {
            this.destroy();
            this._renderRows(this._data);
            this._bindEvents();
            this._rendered = true;
            return this;
        },

        getValues: function () {
            var values = {};
            this._container.find('input, select, textarea').each(function () {
                var $el = $(this);
                var name = $el.attr('name');
                if (!name) return;
                var $radioComp = $el.closest('.radio-components');
                if ($radioComp.length && !$radioComp.is(':visible')) {
                    return;
                }
                var type = $el.attr('type') || '';
                if (type === 'radio') {
                    if ($el.is(':checked')) {
                        values[name] = $el.val();
                    }
                    return;
                }
                if (type === 'checkbox') {
                    if (!values[name]) values[name] = [];
                    if ($el.is(':checked')) {
                        values[name].push($el.val());
                    }
                    return;
                }
                values[name] = $el.val();
            });
            return values;
        },

        setValues: function (data) {
            if (!data || typeof data !== 'object') return this;
            var self = this;
            Object.keys(data).forEach(function (name) {
                var value = data[name];
                var $el = self._container.find('[name="' + name + '"]');
                if ($el.length === 0) return;
                var tag = $el.prop('tagName').toLowerCase();
                var type = $el.attr('type') || '';
                if (tag === 'select') {
                    $el.val(value).trigger('change');
                } else if (type === 'radio') {
                    $el.val([value]);
                    $el.filter(':checked').trigger('change');
                } else if (type === 'checkbox') {
                    if (Array.isArray(value)) {
                        $el.each(function () {
                            $(this).prop('checked', value.indexOf($(this).val()) !== -1);
                        });
                    } else {
                        $el.prop('checked', !!value);
                    }
                } else {
                    $el.val(value);
                }
            });
            return this;
        },

        validate: function () {
            var cls = this._classes;
            var valid = true;
            var cleanupClasses = [cls.hasError, cls.hasSuccess].filter(Boolean).join(' ');
            if (cleanupClasses) {
                this._container.find('[data-fr-group]').removeClass(cleanupClasses);
            }
            if (cls.isInvalid) {
                this._container.find(
                    'input.' + cls.isInvalid + ', select.' + cls.isInvalid + ', textarea.' + cls.isInvalid
                ).removeClass(cls.isInvalid);
            }
            var firstError = null;
            this._container.find('[data-required="true"]').each(function () {
                var $el = $(this);
                var $group = $el.closest('[data-fr-group]');
                var type = $el.attr('type') || '';
                var empty = false;
                if (type === 'radio') {
                    var name = $el.attr('name');
                    var $radios = $group.find('input[type="radio"][name="' + name + '"]');
                    empty = $radios.filter(':checked').length === 0;
                } else if (type === 'checkbox') {
                    empty = !$el.is(':checked');
                } else {
                    empty = !$el.val();
                }
                if (empty) {
                    valid = false;
                    if (cls.hasError) $group.addClass(cls.hasError);
                    if (cls.isInvalid && type !== 'radio') {
                        $el.addClass(cls.isInvalid);
                    }
                    if (!firstError) firstError = $el.length ? $el : $group;
                }
            });
            if (firstError) {
                $('html, body').animate({ scrollTop: firstError.offset().top - 100 }, 300);
                firstError.focus();
            }
            return valid;
        },

        submit: function () {
            if (this.validate()) {
                if (this._onSubmit) {
                    this._onSubmit(this.getValues());
                }
            }
            return this;
        },

        destroy: function () {
            if (this._submitBtn && this._bound.submit) {
                $(this._submitBtn).off('click', this._bound.submit);
            }
            this._container.off('.formrenderer');
            this._container.empty();
            this._rendered = false;
            this._bound = {};
            return this;
        },

        _renderRows: function (data) {
            var self = this;
            var $container = this._container;
            $container.empty();
            data.forEach(function (item) {
                if (Array.isArray(item)) {
                    var cols = item.length || 1;
                    var colSize = Math.floor(12 / Math.max(cols, 1));
                    var $row = $('<div>').addClass(self._classes.row);
                    item.forEach(function (comp) {
                        var $col = $('<div>').addClass(self._colCls(colSize));
                        $col.append(self._renderComponent(comp));
                        $row.append($col);
                    });
                    $container.append($row);
                } else {
                    $container.append(self._renderComponent(item));
                }
            });
        },

        _renderComponent: function (comp) {
            if (!comp || !comp.variant) return '';
            var fn = '_render' + comp.variant;
            if (typeof this[fn] === 'function') {
                return this[fn](comp);
            }
            return this._renderText(comp);
        },

        _renderInput: function (comp) {
            var self = this;
            var cls = this._classes;
            var id = (comp.name || '') + '_' + (comp.id || '');
            var requiredMark = comp.required ? ' <span class="' + (cls.requiredMark || '') + '">*</span>' : '';

            var $group = $('<div>').addClass(cls.formGroup).attr('data-fr-group', '');
            $group.append(
                $('<label>').addClass(cls.formLabel).attr('for', this._escapeHtml(id)).html(this._escapeHtml(comp.label) + requiredMark)
            );

            var $input = $('<input type="text">')
                .addClass(cls.formControl)
                .attr({
                    id: this._escapeHtml(id),
                    name: this._escapeHtml(comp.name),
                    value: comp.value || '',
                    placeholder: comp.placeholder || '',
                    'data-required': !!comp.required
                });
            if (comp.required) $input.attr('required', true);
            if (comp.disabled) $input.attr('disabled', true);

            var $desc = comp.description ? $('<p>').addClass(cls.helpText).text(comp.description) : null;

            if (cls.inputWrapper) {
                var $wrapper = $('<div>').addClass(cls.inputWrapper);
                $wrapper.append($input);
                if ($desc) $wrapper.append($desc);
                $group.append($wrapper);
            } else {
                $group.append($input);
                if ($desc) $group.append($desc);
            }

            $group.on('input.formrenderer', 'input', function () {
                if (self._onChange) self._onChange(comp.name, $(this).val(), comp);
            });
            return $group;
        },

        _renderSelect: function (comp) {
            var self = this;
            var cls = this._classes;
            var id = (comp.name || '') + '_' + (comp.id || '');
            var requiredMark = comp.required ? ' <span class="' + (cls.requiredMark || '') + '">*</span>' : '';

            var $group = $('<div>').addClass(cls.formGroup).attr('data-fr-group', '');
            $group.append(
                $('<label>').addClass(cls.formLabel).attr('for', this._escapeHtml(id)).html(this._escapeHtml(comp.label) + requiredMark)
            );

            var $select = $('<select>')
                .addClass(cls.formControl)
                .attr({
                    id: this._escapeHtml(id),
                    name: this._escapeHtml(comp.name),
                    'data-required': !!comp.required
                });
            if (comp.required) $select.attr('required', true);
            if (comp.disabled) $select.attr('disabled', true);
            if (comp.multiple) $select.attr('multiple', true);

            if (!comp.multiple && comp.placeholder) {
                $select.append('<option value="">' + this._escapeHtml(comp.placeholder) + '</option>');
            }

            var $desc = comp.description ? $('<p>').addClass(cls.helpText).text(comp.description) : null;
            var $inner = cls.inputWrapper ? $('<div>').addClass(cls.inputWrapper) : null;
            var $selectTarget = $inner || $group;

            if (comp.sourceId && this._loadOptions) {
                $select.append('<option value="">Loading...</option>').prop('disabled', true);
                $selectTarget.append($select);
                if ($desc) $selectTarget.append($desc);
                if ($inner) $group.append($inner);

                this._loadOptions(comp.sourceId, function (options) {
                    $select.find('option').remove().end().prop('disabled', !!comp.disabled);
                    if (!comp.multiple && comp.placeholder) {
                        $select.append('<option value="">' + self._escapeHtml(comp.placeholder) + '</option>');
                    }
                    if (options && options.length) {
                        options.forEach(function (opt) {
                            if (typeof opt === 'object') {
                                $select.append('<option value="' + self._escapeHtml(opt.value) + '">' + self._escapeHtml(opt.label) + '</option>');
                            } else {
                                $select.append('<option value="' + self._escapeHtml(opt) + '">' + self._escapeHtml(opt) + '</option>');
                            }
                        });
                    }
                    if (comp.value) $select.val(comp.value);
                });
            } else {
                if (comp.options && comp.options.length) {
                    comp.options.forEach(function (opt) {
                        $select.append('<option value="' + self._escapeHtml(opt) + '">' + self._escapeHtml(opt) + '</option>');
                    });
                }
                $selectTarget.append($select);
                if ($desc) $selectTarget.append($desc);
                if ($inner) $group.append($inner);
                if (comp.value) $select.val(comp.value);
            }

            $group.on('change.formrenderer', 'select[name="' + comp.name + '"]', function () {
                if (self._onChange) self._onChange(comp.name, $(this).val(), comp);
            });
            return $group;
        },

        _renderCheckbox: function (comp) {
            var self = this;
            var cls = this._classes;
            var requiredMark = comp.required ? ' <span class="' + (cls.requiredMark || '') + '">*</span>' : '';

            var $group = $('<div>').addClass(cls.formGroup).attr('data-fr-group', '');
            $group.append($('<label>').addClass(cls.formLabel).html(this._escapeHtml(comp.label) + requiredMark));

            if (comp.options && comp.options.length) {
                comp.options.forEach(function (opt) {
                    var $checkDiv = $('<div>').addClass(cls.checkboxWrapper);
                    var $checkLabel = $('<label>');
                    if (cls.checkboxLabel) $checkLabel.addClass(cls.checkboxLabel);
                    var $input = $('<input type="checkbox">')
                        .attr({
                            name: self._escapeHtml(comp.name),
                            value: self._escapeHtml(opt),
                            'data-required': !!comp.required
                        });
                    if (cls.checkboxInput) $input.addClass(cls.checkboxInput);
                    if (comp.checked) $input.prop('checked', true);
                    if (comp.disabled) $input.attr('disabled', true);
                    $checkLabel.append($input).append(' ' + self._escapeHtml(opt));
                    $checkDiv.append($checkLabel);
                    $group.append($checkDiv);
                });
            }

            if (comp.description) {
                $group.append($('<p>').addClass(cls.helpText).text(comp.description));
            }

            $group.on('change.formrenderer', 'input[type="checkbox"][name="' + comp.name + '"]', function () {
                var vals = [];
                $group.find('input[type="checkbox"][name="' + comp.name + '"]:checked').each(function () {
                    vals.push($(this).val());
                });
                if (self._onChange) self._onChange(comp.name, vals, comp);
            });
            return $group;
        },

        _renderRadio: function (comp) {
            var self = this;
            var cls = this._classes;
            var requiredMark = comp.required ? ' <span class="' + (cls.requiredMark || '') + '">*</span>' : '';
            var radioType = comp.radioType || 'option';

            var $group = $('<div>').addClass(cls.formGroup).attr('data-fr-group', '');
            $group.append($('<label>').addClass(cls.formLabel).html(this._escapeHtml(comp.label) + requiredMark));

            var buildRadioItem = function (name, value, idx) {
                var $radioDiv = $('<div>').addClass(cls.radioWrapper);
                var $radioLabel = $('<label>');
                if (cls.radioLabel) $radioLabel.addClass(cls.radioLabel);
                var $input = $('<input type="radio">')
                    .attr({
                        name: self._escapeHtml(name),
                        value: self._escapeHtml(value),
                        'data-radio-index': idx,
                        'data-required': !!comp.required
                    });
                if (cls.radioInput) $input.addClass(cls.radioInput);
                if (comp.disabled) $input.attr('disabled', true);
                $radioLabel.append($input).append(' ' + self._escapeHtml(value));
                $radioDiv.append($radioLabel);
                return $radioDiv;
            };

            if (radioType === 'component') {
                var ropts = comp.radioOptions || [];
                ropts.forEach(function (ro, idx) {
                    $group.append(buildRadioItem(comp.name, ro.label, idx));
                    var $subContainer = $('<div class="radio-components" style="margin-left:24px;padding:6px;border-left:2px solid #eee;display:none;">').attr('data-radio-index', idx);
                    if (ro.components && ro.components.length) {
                        ro.components.forEach(function (sub) {
                            $subContainer.append(self._renderComponent(sub));
                        });
                    }
                    $group.append($subContainer);
                });

                $group.on('change.formrenderer', 'input[type="radio"][name="' + comp.name + '"]', function () {
                    var idx = $(this).data('radio-index');
                    $group.find('.radio-components').hide();
                    $group.find('.radio-components[data-radio-index="' + idx + '"]').show();
                    if (self._onChange) self._onChange(comp.name, $(this).val(), comp);
                });

                if (ropts.length > 0 && comp.value) {
                    var $target = $group.find('input[type="radio"][name="' + comp.name + '"][value="' + self._escapeHtml(comp.value) + '"]');
                    if ($target.length) $target.prop('checked', true).trigger('change');
                }
            } else {
                (comp.options || []).forEach(function (opt, idx) {
                    var $radioDiv = buildRadioItem(comp.name, opt, idx);
                    if (comp.checked) $radioDiv.find('input').prop('checked', true);
                    $group.append($radioDiv);
                });

                $group.on('change.formrenderer', 'input[type="radio"][name="' + comp.name + '"]', function () {
                    if (self._onChange) self._onChange(comp.name, $(this).val(), comp);
                });
            }

            if (comp.description) {
                $group.append($('<p>').addClass(cls.helpText).text(comp.description));
            }
            return $group;
        },

        _renderText: function (comp) {
            var tag = comp.textType || 'p';
            var content = comp.content || comp.label || '';
            var $el = $('<' + tag + '>').html(content);
            if (comp.id) $el.attr('data-component-id', comp.id);
            return $el;
        },

        _renderHTML: function (comp) {
            var $el = $('<div class="formrenderer-html">').html(comp.content || '');
            if (comp.id) $el.attr('data-component-id', comp.id);
            return $el;
        },

        _bindEvents: function () {
            var self = this;
            if (this._submitBtn) {
                var handler = function (e) {
                    e.preventDefault();
                    self.submit();
                };
                this._bound.submit = handler;
                $(this._submitBtn).on('click', handler);
            }
        },

        _colCls: function (n) {
            var col = this._classes.col;
            if (typeof col === 'function') return col(n);
            if (typeof col === 'string') return col.replace('{n}', n);
            return '';
        },

        _escapeHtml: function (str) {
            if (str == null) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }
    };

    window.FormRenderer = FormRenderer;
    FormRenderer.THEMES = THEMES;
})(jQuery, window);
