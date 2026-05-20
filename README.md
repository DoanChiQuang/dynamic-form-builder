# FormRenderer

Thư viện JavaScript thuần (không cần build) render JSON schema thành HTML form tương tác. Phụ thuộc duy nhất: **jQuery**.

---

## 1. Cài đặt

```html
<!-- jQuery (bắt buộc) -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

<!-- Thư viện -->
<script src="form-renderer.js"></script>

<!-- CSS (tuỳ chọn) -->
<link rel="stylesheet" href="styles.css" />
```

---

## 2. Khởi tạo

```js
var renderer = new FormRenderer({
    container: '#my-form',
    data: schema
});
renderer.render();
```

---

## 3. Options — `new FormRenderer(options)`

| Option | Kiểu | Bắt buộc | Mô tả |
|--------|------|:--------:|-------|
| `container` | `string` | Có | CSS selector của element chứa form |
| `data` | `Array` | Có | Mảng JSON schema — flat hoặc Boxes (xem [Mục 5](#5-schema)) |
| `theme` | `string` | Không | Preset CSS: `'bootstrap3'` (mặc định) · `'bootstrap4'` · `'bootstrap5'` |
| `classes` | `Object` | Không | Ghi đè từng class name — merge lên trên `theme` đã chọn (xem [Mục 7](#7-style)) |
| `loadOptions` | `Function` | Không | `function(sourceId, callback)` — cung cấp options động cho Select có `sourceId` |
| `onChange` | `Function` | Không | `function(name, value, comp)` — gọi mỗi khi field thay đổi |
| `onSubmit` | `Function` | Không | `function(values)` — gọi sau khi `validate()` pass |
| `submitBtn` | `string` | Không | Selector nút submit bên ngoài, ví dụ `'#btn-save'` |

---

## 4. Methods — `renderer.*`

| Method | Trả về | Mô tả |
|--------|--------|-------|
| `render()` | `this` | Render form. Tự động gọi `destroy()` trước khi render lại. |
| `getValues()` | `Object` | Trả về `{ name: value }` của tất cả field đang hiển thị. Checkbox → mảng. Radio component → chỉ nhánh đang hiện. |
| `setValues(data)` | `this` | Điền dữ liệu vào form. Tự trigger `change` để hiện/ẩn sub-components của Radio. |
| `validate()` | `boolean` | Kiểm tra required. Trả về `true` nếu hợp lệ. Tự scroll & focus field lỗi đầu tiên. |
| `submit()` | `this` | Gọi `validate()` rồi `onSubmit(getValues())` nếu hợp lệ. |
| `destroy()` | `this` | Xóa toàn bộ DOM đã render, gỡ bỏ tất cả event listener. |

---

## 5. Schema

Có 2 dạng schema:

**Flat** — mảng component trực tiếp:
```json
[ { "variant": "Input", ... }, { "variant": "Select", ... } ]
```

**Boxes** — mảng box, mỗi box chứa mảng component trong `rows`:
```json
[
    {
        "id": "box_1",
        "title": "Thông tin cá nhân",
        "rows": [
            { "variant": "Input", ... },
            { "variant": "Select", ... }
        ]
    }
]
```

### 5.1. Components

#### Input

```json
{
    "variant": "Input",
    "name": "email",
    "label": "Email",
    "placeholder": "Nhập email...",
    "value": "",
    "required": true,
    "disabled": false,
    "description": "Mô tả hiển thị dưới field"
}
```

---

#### Select

```json
{
    "variant": "Select",
    "name": "city",
    "label": "Thành phố",
    "placeholder": "-- Chọn --",
    "options": [
        { "label": "Hà Nội", "value": "hanoi" },
        { "label": "Hồ Chí Minh", "value": "hcm" }
    ],
    "value": "hanoi",
    "required": true,
    "multiple": false,
    "disabled": false
}
```

`options` chấp nhận mảng string hoặc mảng `{ label, value }`.

**Options tải động** — dùng `sourceId` thay cho `options`:

```json
{
    "variant": "Select",
    "name": "company",
    "label": "Công ty",
    "sourceId": "company_source",
    "required": true
}
```

Cần truyền `loadOptions` khi khởi tạo:

```js
new FormRenderer({
    container: '#form',
    data: schema,
    loadOptions: function(sourceId, callback) {
        $.getJSON('/api/options', { id: sourceId }, callback);
        // callback nhận mảng string hoặc mảng { label, value }
    }
});
```

---

#### Checkbox

```json
{
    "variant": "Checkbox",
    "name": "terms",
    "label": "Điều khoản",
    "options": [
        { "label": "Tôi đồng ý với điều khoản sử dụng.", "value": "1" },
        { "label": "Tôi đã đủ 18 tuổi.", "value": "2" }
    ],
    "required": true,
    "disabled": false
}
```

`getValues()` trả về mảng các `value` được check: `["1", "2"]`.

---

#### Radio — Dạng đơn giản

```json
{
    "variant": "Radio",
    "name": "gender",
    "label": "Giới tính",
    "radioType": "option",
    "options": [
        { "label": "Nam", "value": "male" },
        { "label": "Nữ", "value": "female" }
    ],
    "required": true,
    "disabled": false
}
```

---

#### Radio — Kèm component con

Khi chọn một option, sub-components tương ứng hiển thị. `getValues()` chỉ trả về field của nhánh đang hiện.

```json
{
    "variant": "Radio",
    "name": "member_type",
    "label": "Loại thành viên",
    "radioType": "component",
    "required": true,
    "radioOptions": [
        {
            "label": "Thành viên FPT",
            "value": "fpt",
            "components": [
                { "variant": "Input",  "name": "fpt_email",   "label": "Email FPT",  "required": true },
                { "variant": "Select", "name": "fpt_company", "label": "Công ty",    "options": ["FPT Software", "FPT Telecom"] }
            ]
        },
        {
            "label": "Đối tác",
            "value": "partner",
            "components": [
                { "variant": "Select", "name": "partner_type", "label": "Loại đối tác", "options": ["Doanh nghiệp", "Cá nhân"] }
            ]
        },
        {
            "label": "Khác",
            "value": "other",
            "components": []
        }
    ]
}
```

> `radioOptions[i].value` là giá trị trả về trong `getValues()` khi option đó được chọn. Nếu bỏ qua, giá trị mặc định là `label`.

---

#### Text

```json
{
    "variant": "Text",
    "textType": "p",
    "content": "Vui lòng điền đầy đủ thông tin bên dưới."
}
```

`textType` nhận bất kỳ HTML tag: `p`, `h1`–`h4`, `div`, `span`, v.v.

---

#### HTML

```json
{
    "variant": "HTML",
    "content": "Liên hệ hotline: <a href=\"tel:1900633003\">1900633003</a>"
}
```

> Chỉ dùng với nội dung tin cậy — không escape HTML.

---

### 5.2. Schema mẫu

```json
[
    {
        "id": "box_info",
        "title": "Bổ sung thông tin",
        "rows": [
            {
                "variant": "Text",
                "textType": "p",
                "content": "Vui lòng bổ sung thông tin để ghi nhận thành tích."
            },
            {
                "variant": "Radio",
                "name": "member_type",
                "label": "Loại thành viên",
                "radioType": "component",
                "required": true,
                "radioOptions": [
                    {
                        "label": "Thành viên công ty",
                        "value": "company",
                        "components": [
                            { "variant": "Input",  "name": "work_email", "label": "Email công ty", "required": true },
                            { "variant": "Select", "name": "company",    "label": "Công ty", "sourceId": "company_source", "required": true }
                        ]
                    },
                    {
                        "label": "Khác",
                        "value": "other",
                        "components": []
                    }
                ]
            }
        ]
    },
    {
        "id": "box_terms",
        "title": "Điều khoản",
        "rows": [
            {
                "variant": "Checkbox",
                "name": "terms",
                "label": "Xác nhận",
                "required": true,
                "options": [
                    { "label": "Tôi đồng ý với điều khoản sử dụng.", "value": "1" }
                ]
            }
        ]
    }
]
```

---

## 6. Layout nhiều cột

Bọc các component trong **mảng con** để render cạnh nhau. Thư viện tự chia đều 12 cột.

```json
[
    [
        { "variant": "Input", "name": "first_name", "label": "Họ" },
        { "variant": "Input", "name": "last_name",  "label": "Tên" }
    ],
    { "variant": "Input", "name": "email", "label": "Email" }
]
```

Hàng 1: `Họ` + `Tên` mỗi cột `col-md-6` · Hàng 2: `Email` toàn chiều rộng.

---

## 7. Style

### Themes có sẵn

| Theme | `theme` value | Ghi chú |
|-------|:-------------:|---------|
| Bootstrap 3 | `'bootstrap3'` | Mặc định — không cần khai báo |
| Bootstrap 4 | `'bootstrap4'` | |
| Bootstrap 5 | `'bootstrap5'` | |

```js
// Bootstrap 5
new FormRenderer({ container: '#form', data: schema, theme: 'bootstrap5' });
```

### CSS tùy chỉnh

File `styles.css` đi kèm dùng namespace `dfb-`. Truyền `classes` để ghi đè bất kỳ key nào:

```js
new FormRenderer({
    container: '#form',
    data: schema,
    classes: {
        formGroup:    'dfb-field',
        formLabel:    'dfb-label',
        formControl:  'dfb-input',
        inputWrapper: null,
        hasError:     'dfb-has-error',
        isInvalid:    'dfb-invalid',
        helpText:     'dfb-help',
        requiredMark: 'dfb-required',
        row:          'dfb-row',
        col:          function(n) { return 'dfb-col-' + n; },
        checkboxWrapper: 'dfb-checkbox-item',
        checkboxLabel:   'dfb-checkbox-label',
        checkboxInput:   'dfb-checkbox-input',
        radioWrapper:    'dfb-radio-item',
        radioLabel:      'dfb-radio-label',
        radioInput:      'dfb-radio-input',
        floatWrap:       'dfb-float-wrap',
        floatFilled:     'dfb-is-filled',
        boxWrapper:      'dfb-box',
        boxTitle:        'dfb-box__title',
        boxBody:         'dfb-box__body'
    }
});
```

> Xem `styles.css` để biết đầy đủ các rule CSS tương ứng.

### Bảng đầy đủ các key trong `classes`

| Key | Bootstrap 3 | Bootstrap 4 | Bootstrap 5 | Mô tả |
|-----|:-----------:|:-----------:|:-----------:|-------|
| `formGroup` | `form-group` | `form-group mb-3` | `mb-3` | Wrapper ngoài cùng của mỗi field |
| `formLabel` | `form-label` | `form-label` | `form-label` | Thẻ `<label>` |
| `formControl` | `form-control` | `form-control` | `form-control` | Thẻ `<input>` / `<select>` |
| `inputWrapper` | `input-field` | `null` | `null` | Div bọc trong (`null` = bỏ qua) |
| `hasError` | `has-error` | `has-error` | `has-error` | Thêm vào wrapper khi field lỗi |
| `hasSuccess` | `has-success` | _(rỗng)_ | _(rỗng)_ | Xóa khỏi wrapper mỗi lần validate |
| `isInvalid` | `is-invalid` | `is-invalid` | `is-invalid` | Thêm vào input khi lỗi |
| `helpText` | `help-block text-danger` | `form-text text-danger` | `form-text text-danger` | Đoạn mô tả / ghi chú |
| `requiredMark` | `required` | `text-danger` | `text-danger` | Class span dấu `*` |
| `row` | `row` | `form-row` | `row` | Div hàng multi-column |
| `col` | `function(n)` | `function(n)` | `function(n)` | Class cột — function hoặc template `'col-{n}'` |
| `checkboxWrapper` | `checkbox` | `form-check` | `form-check` | Div bọc mỗi checkbox option |
| `checkboxLabel` | `null` | `form-check-label` | `form-check-label` | `<label>` trong checkbox |
| `checkboxInput` | `null` | `form-check-input` | `form-check-input` | Class bổ sung cho `<input type="checkbox">` |
| `radioWrapper` | `radio` | `form-check` | `form-check` | Div bọc mỗi radio option |
| `radioLabel` | `null` | `form-check-label` | `form-check-label` | `<label>` trong radio |
| `radioInput` | `null` | `form-check-input` | `form-check-input` | Class bổ sung cho `<input type="radio">` |
| `floatWrap` | `null` | `null` | `null` | Div bọc input+label cho floating label. `null` = layout truyền thống. |
| `floatFilled` | `null` | `null` | `null` | Class JS toggle trên `floatWrap` khi select có giá trị. `null` = không toggle. |
| `boxWrapper` | _(rỗng)_ | _(rỗng)_ | _(rỗng)_ | Div bọc mỗi Box (schema dạng Boxes). `''` = render div nhưng không thêm class. |
| `boxTitle` | _(rỗng)_ | _(rỗng)_ | _(rỗng)_ | Thẻ `<h3>` tiêu đề Box. |
| `boxBody` | _(rỗng)_ | _(rỗng)_ | _(rỗng)_ | Div body bên trong Box. |

---

## 8. Validation

`validate()` kiểm tra tất cả field có `required: true` đang **hiển thị**.

| Loại field | Điều kiện lỗi |
|-----------|---------------|
| Input / Select / Textarea | `val()` là falsy (rỗng) |
| Checkbox | Checkbox đó không được check |
| Radio | Không có option nào được chọn trong nhóm |

**Khi có lỗi:**
- Thêm class `hasError` vào wrapper field (`[data-fr-group]`)
- Thêm class `isInvalid` vào input lỗi (Radio: thêm vào tất cả radio input trong nhóm)
- Tự động scroll đến và focus vào field lỗi đầu tiên

**Radio với sub-components:** Chỉ validate sub-components của option **đang được chọn**. Sub-components của option ẩn bị bỏ qua hoàn toàn.

**Reset trạng thái:** Mỗi lần gọi `validate()`, tất cả class lỗi được xóa trước khi kiểm tra lại.
