# Dynamic Form Builder

Bộ thư viện JavaScript thuần (không cần build, không cần package manager) để **tạo và render dynamic form** từ JSON schema. Gồm hai module độc lập:

| Module | File | Mô tả |
|--------|------|-------|
| **FormRenderer** | `renderer/form-renderer.js` | Render JSON schema → HTML form tương tác. Phụ thuộc: jQuery. |
| **FormSchemaBuilder** | `builder/form-builder.js` | API lập trình để sinh JSON schema. Không phụ thuộc gì. |

---

## Cấu trúc thư mục

```
dynamic-form-builder/
├── renderer/
│   ├── form-renderer.js   # Thư viện render form
│   ├── styles.css         # CSS mặc định (namespace dfb-)
│   ├── example.html       # Demo dùng raw JSON schema
│   └── README.md          # Tài liệu chi tiết FormRenderer
├── builder/
│   ├── form-builder.js    # Thư viện sinh schema
│   ├── example.html       # Demo dùng FormSchemaBuilder API
│   └── README.md          # Tài liệu chi tiết FormSchemaBuilder
└── schema.json            # Schema mẫu
```

---

## Quickstart

### 1. Chỉ dùng FormRenderer (render từ JSON có sẵn)

```html
<!-- 1. Load jQuery + thư viện -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script src="renderer/form-renderer.js"></script>
<link rel="stylesheet" href="renderer/styles.css" />

<!-- 2. Container -->
<div class="dfb-wrapper">
  <form id="my-form">
    <div id="form-container"></div>
    <button type="button" id="btn-submit" class="dfb-button">Gửi</button>
  </form>
</div>

<script>
var schema = [
  {
    id: 'box_1',
    title: 'Thông tin cá nhân',
    rows: [
      { variant: 'Input',  name: 'full_name', label: 'Họ tên',   required: true },
      { variant: 'Select', name: 'city',      label: 'Thành phố', required: true,
        options: [{ label: 'Hà Nội', value: 'hanoi' }, { label: 'TP.HCM', value: 'hcm' }] }
    ]
  }
];

var renderer = new FormRenderer({
  container: '#form-container',
  data: schema,
  submitBtn: '#btn-submit',
  onSubmit: function (values) {
    console.log(values); // { full_name: '...', city: '...' }
  }
});
renderer.render();
</script>
```

### 2. Dùng FormSchemaBuilder + FormRenderer (sinh schema bằng code)

```html
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script src="builder/form-builder.js"></script>
<script src="renderer/form-renderer.js"></script>
<link rel="stylesheet" href="renderer/styles.css" />

<script>
var B = FormSchemaBuilder;

var schema = new B.FormSchema({ title: 'Đăng ký', key_name: 'registration' });

var box = schema.addBox('Thông tin');
box.addRow(B.Input({ label: 'Họ tên', name: 'full_name', required: true }));
box.addRow(
  B.Input({ label: 'Email', name: 'email', required: true }),
  B.Select({ label: 'Cự ly', name: 'distance', options: ['5km', '10km', '21km'] })
);

var renderer = new FormRenderer({
  container: '#form-container',
  data: schema.toJSON().boxes,
  submitBtn: '#btn-submit',
  onSubmit: function (values) { console.log(values); }
});
renderer.render();
</script>
```

---

## FormRenderer

### Khởi tạo

```js
var renderer = new FormRenderer(options);
renderer.render();
```

### Options

| Option | Kiểu | Bắt buộc | Mô tả |
|--------|------|:--------:|-------|
| `container` | `string` | Có | CSS selector của element chứa form |
| `data` | `Array` | Có | JSON schema — flat array hoặc Boxes format |
| `theme` | `string` | Không | `'bootstrap3'` (mặc định) · `'bootstrap4'` · `'bootstrap5'` |
| `classes` | `Object` | Không | Ghi đè class name — merge lên trên theme đã chọn |
| `loadOptions` | `Function` | Không | `function(sourceId, callback)` — cấp options động cho Select |
| `onChange` | `Function` | Không | `function(name, value, comp)` — gọi khi field thay đổi |
| `onSubmit` | `Function` | Không | `function(values)` — gọi sau khi validate pass |
| `submitBtn` | `string` | Không | Selector nút submit bên ngoài |

### Methods

| Method | Trả về | Mô tả |
|--------|--------|-------|
| `render()` | `this` | Render form (tự gọi `destroy()` trước nếu đã render) |
| `getValues()` | `Object` | `{ name: value }` của tất cả field đang hiển thị |
| `setValues(data)` | `this` | Điền dữ liệu; tự trigger `change` để show/hide Radio sub-components |
| `validate()` | `boolean` | Kiểm tra required; scroll & focus field lỗi đầu tiên |
| `submit()` | `this` | Gọi `validate()` rồi `onSubmit(getValues())` nếu hợp lệ |
| `destroy()` | `this` | Xóa DOM đã render, gỡ event listener |

---

## Các component trong schema

### Input

```json
{ "variant": "Input", "name": "email", "label": "Email", "required": true, "placeholder": "Nhập email..." }
```

### Select

```json
{
  "variant": "Select", "name": "city", "label": "Thành phố", "required": true,
  "options": [{ "label": "Hà Nội", "value": "hanoi" }, { "label": "TP.HCM", "value": "hcm" }]
}
```

**Options động** — dùng `sourceId` thay cho `options`, cần khai báo `loadOptions`:

```js
// Schema
{ "variant": "Select", "name": "company", "label": "Công ty", "sourceId": "company_source" }

// Khi khởi tạo renderer
loadOptions: function(sourceId, callback) {
  $.getJSON('/api/options?id=' + sourceId, callback);
}
```

### Checkbox

```json
{
  "variant": "Checkbox", "name": "terms", "label": "Điều khoản", "required": true,
  "options": [
    { "label": "Tôi đồng ý với điều khoản sử dụng.", "value": "1" },
    { "label": "Tôi xác nhận đã đủ 18 tuổi.", "value": "2" }
  ]
}
```

`getValues()` trả về mảng value đã check: `["1", "2"]`.

### Radio — đơn giản

```json
{
  "variant": "Radio", "name": "gender", "label": "Giới tính",
  "radioType": "option", "required": true,
  "options": [{ "label": "Nam", "value": "male" }, { "label": "Nữ", "value": "female" }]
}
```

### Radio — kèm sub-components

Khi chọn một option, các sub-components tương ứng hiển thị. `getValues()` chỉ trả về field của nhánh đang hiện.

```json
{
  "variant": "Radio", "name": "member_type", "label": "Loại thành viên",
  "radioType": "component", "required": true,
  "radioOptions": [
    {
      "label": "Thành viên FPT", "value": "fpt",
      "components": [
        { "variant": "Input",  "name": "work_email",  "label": "Email công ty", "required": true },
        { "variant": "Select", "name": "fpt_company", "label": "Đơn vị", "sourceId": "fpt_units" }
      ]
    },
    { "label": "Runner tự do", "value": "free", "components": [] }
  ]
}
```

### Text

```json
{ "variant": "Text", "textType": "p", "content": "Vui lòng điền đầy đủ thông tin." }
```

`textType` nhận bất kỳ HTML tag: `p`, `h1`–`h4`, `div`, v.v.

### HTML

```json
{ "variant": "HTML", "content": "Hotline: <a href=\"tel:1900633003\">1900633003</a>" }
```

> Không escape HTML — chỉ dùng với nội dung tin cậy.

---

## Layout nhiều cột

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

Hàng 1: `Họ` + `Tên` mỗi cột 6/12 · Hàng 2: `Email` toàn chiều rộng.

---

## Styling

### Themes có sẵn

```js
// Bootstrap 3 (mặc định — không cần khai báo)
new FormRenderer({ container: '#form', data: schema });

// Bootstrap 4
new FormRenderer({ container: '#form', data: schema, theme: 'bootstrap4' });

// Bootstrap 5
new FormRenderer({ container: '#form', data: schema, theme: 'bootstrap5' });
```

### CSS tùy chỉnh (dfb-)

File `renderer/styles.css` dùng namespace `dfb-`. Kết hợp với `classes` để áp dụng:

```js
new FormRenderer({
  container: '#form',
  data: schema,
  classes: {
    formGroup:       'dfb-field',
    formLabel:       'dfb-label',
    formControl:     'dfb-input',
    inputWrapper:    null,           // null = bỏ qua wrapper này
    hasError:        'dfb-has-error',
    isInvalid:       'dfb-invalid',
    helpText:        'dfb-help',
    requiredMark:    'dfb-required',
    row:             'dfb-row',
    col:             function(n) { return 'dfb-col-' + n; },
    checkboxWrapper: 'dfb-checkbox-item',
    checkboxLabel:   'dfb-checkbox-label',
    checkboxInput:   'dfb-checkbox-input',
    radioWrapper:    'dfb-radio-item',
    radioLabel:      'dfb-radio-label',
    radioInput:      'dfb-radio-input',
    floatWrap:       'dfb-float-wrap',   // bật floating label
    floatFilled:     'dfb-is-filled',
    boxWrapper:      'dfb-box',
    boxTitle:        'dfb-box__title',
    boxBody:         'dfb-box__body'
  }
});
```

> Floating label cho input: CSS-only qua `:placeholder-shown`. Floating label cho select: JS toggle class `floatFilled`.

---

## FormSchemaBuilder

Sinh JSON schema bằng code thay vì viết JSON thủ công. Không phụ thuộc gì — dùng được cả Node.js và browser.

### Quy trình

```
new FormSchema(meta)
  └── .addBox(title) → FormBox
        └── .addRow(comp1, comp2, …)  ← một hoặc nhiều component/cột
```

### Ví dụ đầy đủ

```js
var B = FormSchemaBuilder;

var schema = new B.FormSchema({
  title:       'Form đăng ký vRace',
  key_name:    'vrace_registration',
  description: 'Form đăng ký sự kiện chạy bộ',
  enabled:     true
});

// Box 1
var box1 = schema.addBox('Thông tin cá nhân');

box1.addRow(B.Text({ content: 'Điền thông tin cá nhân bên dưới.', textType: 'p' }));

box1.addRow(
  B.Input({ label: 'Họ', name: 'last_name', required: true }),
  B.Input({ label: 'Tên', name: 'first_name', required: true })
);

box1.addRow(B.Select({
  label: 'Thành phố', name: 'city', required: true,
  options: [
    { label: 'Hà Nội', value: 'hanoi' },
    { label: 'TP.HCM', value: 'hcm' }
  ]
}));

// Box 2
var box2 = schema.addBox('Loại thành viên');

box2.addRow(B.Radio({
  label: 'Bạn là', name: 'member_type', required: true, radioType: 'component',
  radioOptions: [
    B.RadioOption({
      label: 'Thành viên FPT', value: 'fpt',
      components: [
        B.Input({ label: 'Email công ty', name: 'work_email', required: true }),
        B.Select({ label: 'Đơn vị', name: 'unit', sourceId: 'fpt_units_source' })
      ]
    }),
    B.RadioOption({ label: 'Runner tự do', value: 'free' })
  ]
}));

// Box 3
var box3 = schema.addBox('Điều khoản');

box3.addRow(B.Checkbox({
  label: 'Xác nhận', name: 'terms', required: true,
  options: [
    { label: 'Tôi xác nhận đã đủ 18 tuổi.', value: '1' },
    { label: 'Tôi đồng ý với Điều Khoản Sử Dụng.', value: '2' }
  ]
}));

// Xuất
var json    = schema.toJSON();    // plain object → dùng với FormRenderer
var jsonStr = schema.toString();  // chuỗi JSON đẹp → lưu DB / log

// Render ngay
var renderer = new FormRenderer({
  container: '#form-container',
  data: json.boxes
});
renderer.render();
```

### API tham chiếu nhanh

| Hàm | Mô tả |
|-----|-------|
| `new B.FormSchema(opts)` | Tạo schema mới với `title`, `key_name`, `description`, `enabled` |
| `schema.addBox(title)` | Thêm box, trả về `FormBox` để chain |
| `schema.toJSON()` | Xuất plain object |
| `schema.toString()` | Xuất chuỗi JSON đẹp |
| `box.addRow(comp…)` | Thêm row; nhiều comp → nhiều cột; trả về `FormBox` (chainable) |
| `B.Input(opts)` | Text input |
| `B.Select(opts)` | Dropdown (hỗ trợ `multiple`, `sourceId`) |
| `B.Checkbox(opts)` | Nhóm checkbox |
| `B.Radio(opts)` | Nhóm radio (`radioType: 'option'` hoặc `'component'`) |
| `B.RadioOption(opts)` | Một nhánh của Radio component |
| `B.Text(opts)` | Đoạn văn bản tĩnh |
| `B.HTML(opts)` | Raw HTML (không escape) |
| `B.parse(json)` | Load schema từ JSON có sẵn → `FormSchema` instance |

### Parse schema từ server

```js
// Hỗ trợ cả 3 định dạng lịch sử:
// { boxes, title, … }  — format hiện tại (multi-box)
// { rows, title, … }   — format cũ (single-box)
// [comp, comp, …]      — raw array (oldest)

var schema = B.parse(savedJSON);
schema.addBox('Box mới').addRow(B.Input({ label: 'SĐT', name: 'phone' }));
console.log(schema.toString());
```

---

## Xem thêm

- [`renderer/README.md`](renderer/README.md) — tài liệu đầy đủ FormRenderer
- [`builder/README.md`](builder/README.md) — tài liệu đầy đủ FormSchemaBuilder
- [`renderer/example.html`](renderer/example.html) — demo render từ JSON schema
- [`builder/example.html`](builder/example.html) — demo dùng FormSchemaBuilder API
