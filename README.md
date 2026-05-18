# Hướng dẫn sử dụng FormRenderer

`FormRenderer` là thư viện JavaScript thuần (không cần build) dùng để render một mảng JSON schema (output từ FormBuilder) thành HTML form tương tác. Phụ thuộc vào **jQuery** và **CSS framework** tùy chọn.

---

## Mục lục

1. [Cài đặt](#1-cài-đặt)
2. [Khởi tạo](#2-khởi-tạo)
3. [Options](#3-options)
4. [Methods](#4-methods)
5. [Schema các loại component](#5-schema-các-loại-component)
6. [Layout nhiều cột](#6-layout-nhiều-cột)
7. [Tùy chỉnh CSS theo framework](#7-tùy-chỉnh-css-theo-framework)
8. [Validation](#8-validation)
9. [Ví dụ thực tế](#9-ví-dụ-thực-tế)

---

## 1. Cài đặt

Nhúng jQuery và `form-renderer.js` vào trang. CSS framework là tùy chọn — xem [Mục 7](#7-tùy-chỉnh-css-theo-framework).

```html
<!-- jQuery (bắt buộc) -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

<!-- Bootstrap 3 (mặc định, có thể thay bằng framework khác) -->
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">

<!-- Thư viện -->
<script src="/path/to/form-renderer.js"></script>
```

---

## 2. Khởi tạo

```html
<div id="my-form"></div>

<script>
var renderer = new FormRenderer({
    container: '#my-form',
    data: schemaArray
});
renderer.render();
</script>
```

---

## 3. Options

| Option | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `container` | `string` \| `Element` | Có | CSS selector hoặc DOM element chứa form |
| `data` | `Array` | Có | Mảng JSON schema từ FormBuilder |
| `theme` | `string` | Không | Preset CSS: `'bootstrap3'` (mặc định), `'bootstrap4'`, `'bootstrap5'` |
| `classes` | `Object` | Không | Ghi đè từng class name — merge lên trên `theme` đã chọn |
| `onChange` | `Function` | Không | `function(name, value, comp)` — gọi mỗi khi field thay đổi |
| `onSubmit` | `Function` | Không | `function(values)` — gọi sau khi `validate()` pass |
| `submitBtn` | `string` | Không | Selector của nút submit bên ngoài, ví dụ `'#btn-save'` |
| `loadOptions` | `Function` | Không | `function(sourceId, callback)` — cung cấp options động cho Select có `sourceId` |

---

## 4. Methods

Tất cả method (trừ `getValues`, `validate`) đều trả về `this`, hỗ trợ chain.

### `render()`
Render form vào container. Tự động gọi `destroy()` trước khi render lại.

```js
renderer.render();
```

### `getValues()`
Trả về object `{ fieldName: value, ... }` của toàn bộ field đang hiển thị.

- Checkbox trả về **mảng** các giá trị được chọn.
- Radio với `radioType: 'component'`: chỉ trả về field thuộc nhánh đang hiển thị.

```js
var data = renderer.getValues();
// { email: 'a@b.com', hobbies: ['Đọc', 'Bơi'], gender: 'Nam' }
```

### `setValues(data)`
Điền dữ liệu vào form từ object. Tự động trigger `change` để hiện/ẩn component con của Radio.

```js
renderer.setValues({ email: 'a@b.com', gender: 'Nam' });
```

### `validate()`
Kiểm tra tất cả field có `required: true`. Trả về `true` nếu hợp lệ, `false` nếu có lỗi.

Khi có lỗi:
- Thêm class `hasError` vào wrapper của field lỗi
- Thêm class `isInvalid` vào input lỗi
- Tự động scroll đến và focus vào field lỗi đầu tiên

```js
if (renderer.validate()) {
    // xử lý submit
}
```

### `submit()`
Gọi `validate()` rồi gọi `onSubmit(getValues())` nếu hợp lệ.

```js
renderer.submit();
```

### `destroy()`
Xóa toàn bộ DOM đã render, gỡ bỏ tất cả event listener.

```js
renderer.destroy();
```

---

## 5. Schema các loại component

Mỗi phần tử trong mảng `data` là một object với field `variant` xác định loại.

### Input — Ô nhập text

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

| Field | Bắt buộc | Mô tả |
|-------|----------|-------|
| `name` | Có | Key trong `getValues()` |
| `label` | Có | Nhãn hiển thị |
| `placeholder` | Không | Placeholder |
| `value` | Không | Giá trị mặc định |
| `required` | Không | Bật validate bắt buộc |
| `disabled` | Không | Disable field |
| `description` | Không | Ghi chú bên dưới field |

---

### Select — Dropdown

```json
{
    "variant": "Select",
    "name": "city",
    "label": "Thành phố",
    "placeholder": "-- Chọn thành phố --",
    "options": ["Hà Nội", "Hồ Chí Minh", "Đà Nẵng"],
    "value": "Hà Nội",
    "required": true,
    "multiple": false,
    "disabled": false,
    "description": ""
}
```

**Select với options tải động** — dùng `sourceId` thay cho `options`:

```json
{
    "variant": "Select",
    "name": "partner",
    "label": "Đối tác",
    "placeholder": "-- Chọn đối tác --",
    "sourceId": "src_partner_list",
    "required": true
}
```

Khi dùng `sourceId`, phải truyền `loadOptions` khi khởi tạo:

```js
new FormRenderer({
    container: '#form',
    data: schema,
    loadOptions: function(sourceId, callback) {
        $.getJSON('/api/options', { id: sourceId }, function(res) {
            // callback nhận mảng string hoặc mảng { value, label }
            callback(res);
        });
    }
});
```

---

### Checkbox — Chọn nhiều

```json
{
    "variant": "Checkbox",
    "name": "hobbies",
    "label": "Sở thích",
    "options": ["Đọc sách", "Chạy bộ", "Bơi lội"],
    "required": false,
    "disabled": false,
    "description": ""
}
```

`getValues()` trả về mảng các giá trị được check: `["Đọc sách", "Bơi lội"]`

---

### Radio — Chọn một (dạng đơn giản)

```json
{
    "variant": "Radio",
    "name": "gender",
    "label": "Giới tính",
    "radioType": "option",
    "options": ["Nam", "Nữ", "Khác"],
    "required": true,
    "disabled": false
}
```

---

### Radio — Chọn một kèm component con

Khi chọn một option, các field con tương ứng sẽ hiển thị. `getValues()` chỉ trả về field của nhánh đang hiển thị.

```json
{
    "variant": "Radio",
    "name": "member_type",
    "label": "Loại thành viên",
    "radioType": "component",
    "value": "Thành viên FPT",
    "radioOptions": [
        {
            "label": "Thành viên FPT",
            "components": [
                {
                    "variant": "Input",
                    "name": "fpt_email",
                    "label": "Email FPT",
                    "required": true
                },
                {
                    "variant": "Select",
                    "name": "fpt_company",
                    "label": "Công ty",
                    "options": ["FPT Software", "FPT Telecom", "FPT Education"]
                }
            ]
        },
        {
            "label": "Đối tác",
            "components": [
                {
                    "variant": "Select",
                    "name": "partner_type",
                    "label": "Loại đối tác",
                    "options": ["Doanh nghiệp", "Cá nhân"]
                }
            ]
        }
    ]
}
```

> `value` trong Radio component xác định nhánh được chọn mặc định khi render.

---

### Text — Nội dung tĩnh

```json
{
    "variant": "Text",
    "textType": "p",
    "content": "Vui lòng điền đầy đủ thông tin bên dưới."
}
```

| `textType` | HTML tag |
|-----------|----------|
| `p` | `<p>` |
| `h1` – `h4` | `<h1>` – `<h4>` |
| `div` | `<div>` |
| `span` | `<span>` |

---

### HTML — Nội dung HTML tùy ý

```json
{
    "variant": "HTML",
    "content": "<div class=\"alert alert-info\">Lưu ý: thông tin sẽ được bảo mật.</div>"
}
```

> Đây là loại duy nhất cho phép inject HTML thô. Chỉ dùng với nội dung tin cậy.

---

## 6. Layout nhiều cột

Bọc các component trong một **mảng con** để render cạnh nhau. Thư viện tự tính `col-md-{n}` chia đều 12 cột.

```json
[
    [
        { "variant": "Input", "name": "first_name", "label": "Họ" },
        { "variant": "Input", "name": "last_name",  "label": "Tên" }
    ],
    { "variant": "Input", "name": "email", "label": "Email" }
]
```

Kết quả:
- Hàng 1: `Họ` và `Tên` chia đôi (mỗi cột `col-md-6`)
- Hàng 2: `Email` chiếm toàn chiều rộng

Có thể xếp tối đa bao nhiêu cột tùy ý — thư viện tự chia (`12 / số cột`).

---

## 7. Tùy chỉnh CSS theo framework

### Sử dụng preset sẵn

```js
// Bootstrap 3 (mặc định — không cần khai báo theme)
new FormRenderer({ container: '#form', data: schema });

// Bootstrap 4
new FormRenderer({ container: '#form', data: schema, theme: 'bootstrap4' });

// Bootstrap 5
new FormRenderer({ container: '#form', data: schema, theme: 'bootstrap5' });
```

### Ghi đè một số class

```js
new FormRenderer({
    container: '#form',
    data: schema,
    theme: 'bootstrap5',
    classes: {
        requiredMark: 'text-danger fw-bold',
        helpText: 'form-text text-muted fst-italic'
    }
});
```

### Dùng CSS hoàn toàn tùy chỉnh (không dùng Bootstrap)

```js
new FormRenderer({
    container: '#form',
    data: schema,
    classes: {
        formGroup:      'field-wrap',
        formLabel:      'field-label',
        formControl:    'field-input',
        inputWrapper:   null,            // null = không render div bọc thêm
        hasError:       'field-error',
        hasSuccess:     '',
        isInvalid:      'field-input--invalid',
        helpText:       'field-hint',
        requiredMark:   'required-star',
        row:            'field-row',
        col:            'field-col-{n}', // hoặc function(n) { return 'col-' + n; }
        checkboxWrapper: 'check-item',
        radioWrapper:    'radio-item',
        checkboxLabel:   null,
        radioLabel:      null,
        checkboxInput:   null,
        radioInput:      null
    }
});
```

### Bảng đầy đủ các key trong `classes`

| Key | Bootstrap 3 | Bootstrap 4 | Bootstrap 5 | Mô tả |
|-----|-------------|-------------|-------------|-------|
| `formGroup` | `form-group` | `form-group mb-3` | `mb-3` | Wrapper ngoài cùng của mỗi field |
| `formLabel` | `form-label` | `form-label` | `form-label` | Thẻ `<label>` |
| `formControl` | `form-control` | `form-control` | `form-control` | Thẻ `<input>` / `<select>` |
| `inputWrapper` | `input-field` | `null` | `null` | Div bọc trong (null = bỏ qua) |
| `hasError` | `has-error` | `has-error` | `has-error` | Thêm vào wrapper khi lỗi |
| `hasSuccess` | `has-success` | _(rỗng)_ | _(rỗng)_ | Xóa khỏi wrapper mỗi lần validate |
| `isInvalid` | `is-invalid` | `is-invalid` | `is-invalid` | Thêm vào input khi lỗi |
| `helpText` | `help-block text-danger` | `form-text text-danger` | `form-text text-danger` | Đoạn mô tả/ghi chú |
| `requiredMark` | `required` | `text-danger` | `text-danger` | Class span dấu `*` |
| `row` | `row` | `form-row` | `row` | Div hàng multi-column |
| `col` | `function(n)` | `function(n)` | `function(n)` | Class cột (function hoặc template `col-{n}`) |
| `checkboxWrapper` | `checkbox` | `form-check` | `form-check` | Div bọc mỗi checkbox |
| `radioWrapper` | `radio` | `form-check` | `form-check` | Div bọc mỗi radio |
| `checkboxLabel` | `null` | `form-check-label` | `form-check-label` | Class `<label>` trong checkbox |
| `radioLabel` | `null` | `form-check-label` | `form-check-label` | Class `<label>` trong radio |
| `checkboxInput` | `null` | `form-check-input` | `form-check-input` | Class bổ sung cho `<input type="checkbox">` |
| `radioInput` | `null` | `form-check-input` | `form-check-input` | Class bổ sung cho `<input type="radio">` |

> Tham chiếu danh sách theme đầy đủ: `FormRenderer.THEMES`

---

## 8. Validation

Thư viện validate khi gọi `validate()` hoặc `submit()`.

**Điều kiện lỗi:**

| Loại field | Điều kiện lỗi |
|-----------|---------------|
| Input / Select / Textarea | `val()` là falsy (rỗng) |
| Radio | Không có option nào được chọn trong nhóm |
| Checkbox | Checkbox đó không được check |

**Khi có lỗi:**
- Thêm class `hasError` vào wrapper field (`[data-fr-group]`)
- Thêm class `isInvalid` vào input (trừ Radio)
- Scroll và focus vào field lỗi đầu tiên

**Reset trạng thái:** Mỗi lần gọi `validate()`, tất cả class lỗi được xóa trước khi kiểm tra lại.

---

## 9. Ví dụ thực tế

### Form đăng ký giải chạy

```html
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script src="/path/to/form-renderer.js"></script>

<div id="register-form"></div>
<button id="btn-register" class="btn btn-primary">Đăng ký</button>

<script>
var schema = [
    // Hàng 2 cột: Họ và Tên
    [
        { "variant": "Input", "name": "first_name", "label": "Họ", "required": true },
        { "variant": "Input", "name": "last_name",  "label": "Tên", "required": true }
    ],
    { "variant": "Input",  "name": "email", "label": "Email", "required": true, "placeholder": "example@email.com" },
    { "variant": "Input",  "name": "phone", "label": "Số điện thoại", "placeholder": "0912..." },
    { "variant": "Select", "name": "distance", "label": "Cự ly", "required": true,
      "placeholder": "-- Chọn cự ly --",
      "options": ["5km", "10km", "21km", "42km"] },
    { "variant": "Radio",  "name": "gender", "label": "Giới tính", "radioType": "option",
      "options": ["Nam", "Nữ"] },
    { "variant": "Select", "name": "company", "label": "Đơn vị công tác",
      "sourceId": "src_companies", "placeholder": "-- Tìm đơn vị --" },
    { "variant": "Text",   "textType": "p",
      "content": "<small class='text-muted'>Thông tin của bạn sẽ được bảo mật.</small>" }
];

$.getJSON('/api/form-schema', { race_id: 123 }, function(res) {
    var renderer = new FormRenderer({
        container: '#register-form',
        data: res.data || schema,

        loadOptions: function(sourceId, callback) {
            $.getJSON('/api/options', { id: sourceId }, callback);
        },

        onChange: function(name, value, comp) {
            console.log(name, '=', value);
        },

        submitBtn: '#btn-register',
        onSubmit: function(values) {
            $.post('/api/register', { race_id: 123, data: JSON.stringify(values) })
                .done(function() { alert('Đăng ký thành công!'); })
                .fail(function() { alert('Có lỗi xảy ra, vui lòng thử lại.'); });
        }
    });

    renderer.render();
});
</script>
```

### Dùng với Bootstrap 5

```js
var renderer = new FormRenderer({
    container: '#form',
    data: schema,
    theme: 'bootstrap5',
    submitBtn: '#btn-submit',
    onSubmit: function(values) {
        fetch('/api/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values)
        });
    }
});
renderer.render();
```

### Re-render khi schema thay đổi

```js
// Lần đầu render
renderer.render();

// Cập nhật data rồi render lại (destroy tự động được gọi bên trong)
renderer._data = newSchema;
renderer.render();
```

### Lấy và điền dữ liệu thủ công

```js
// Lấy toàn bộ giá trị
var values = renderer.getValues();

// Điền lại form từ dữ liệu đã lưu
renderer.setValues({
    first_name: 'Nguyễn',
    last_name:  'Văn A',
    distance:   '21km',
    gender:     'Nam'
});
```
