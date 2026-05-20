# FormSchemaBuilder

Thư viện JavaScript thuần (không cần build) để **tạo Schema JSON** bằng code thay vì viết JSON thủ công. Schema sinh ra tương thích hoàn toàn với **FormRenderer** và **Dynamic Form Builder** trong hệ thống vRace.

Phụ thuộc: **không có** (chạy cả Node.js và browser).

---

## 1. Cài đặt

**Browser:**
```html
<script src="form-builder.js"></script>
<!-- Sau đó dùng qua global: FormSchemaBuilder -->
```

**Node.js:**
```js
const B = require('./form-builder');
```

---

## 2. Quy trình cơ bản

```
new FormSchema(meta)
  └── .addBox(title) → FormBox
        └── .addRow(comp1, comp2, …) → FormBox (chainable)
              └── Input / Select / Checkbox / Radio / Text / HTML
```

```js
var B = FormSchemaBuilder;

var schema = new B.FormSchema({ title: 'Đăng ký', key_name: 'srace' });

var box = schema.addBox('Thông tin cá nhân');
box.addRow(B.Input({ label: 'Họ tên', name: 'full_name', required: true }));
box.addRow(
  B.Select({ label: 'Cự ly', name: 'distance', options: [...] }),
  B.Input({ label: 'Mã giới thiệu', name: 'ref_code' })
);

var json    = schema.toJSON();    // plain object → dùng với FormRenderer
var jsonStr = schema.toString();  // chuỗi JSON đẹp  → lưu DB / log
```

---

## 3. FormSchema

```js
new B.FormSchema(opts)
```

| Thuộc tính | Kiểu | Mặc định | Mô tả |
|-----------|------|:-------:|-------|
| `title` | `string` | `''` | Tiêu đề form |
| `key_name` | `string` | `''` | Key định danh (`srace`, `edurun`, …) |
| `description` | `string` | `''` | Mô tả ngắn |
| `enabled` | `boolean` | `true` | Trạng thái kích hoạt |

### Methods

| Method | Trả về | Mô tả |
|--------|--------|-------|
| `addBox(title)` | `FormBox` | Thêm box mới, trả về instance để chain |
| `toJSON()` | `Object` | Plain object — dùng trực tiếp với `FormRenderer` |
| `toString()` | `string` | JSON đẹp (indent 2) |

---

## 4. FormBox

Không khởi tạo trực tiếp — lấy qua `schema.addBox()`.

### Methods

| Method | Trả về | Mô tả |
|--------|--------|-------|
| `addRow(comp)` | `FormBox` | Row 1 cột |
| `addRow(comp1, comp2, …)` | `FormBox` | Row nhiều cột — tự chia đều `col-md-*` |

```js
// Row 1 cột
box.addRow(B.Input({ label: 'Email', name: 'email' }));

// Row 2 cột (nằm cạnh nhau)
box.addRow(
  B.Input({ label: 'Họ', name: 'first_name' }),
  B.Input({ label: 'Tên', name: 'last_name' })
);

// Chainable
box
  .addRow(B.Text({ content: 'Vui lòng điền...', textType: 'p' }))
  .addRow(B.Input({ label: 'Họ tên', name: 'full_name', required: true }));
```

---

## 5. Components

Tất cả factory function nhận một `opts` object. Các field không truyền sẽ dùng giá trị mặc định.

### Input

```js
B.Input({
  label:       'Họ tên',
  name:        'full_name',
  placeholder: 'Nhập họ tên...',
  description: 'Mô tả hiển thị dưới field',
  required:    true,
  disabled:    false,
  value:       ''
})
```

| Field | Mặc định |
|-------|:--------:|
| `label` | `'New Input'` |
| `name` | auto-generated |
| `placeholder` | `'Enter value'` |
| `description` | `''` |
| `required` | `false` |
| `disabled` | `false` |
| `value` | `''` |

---

### Select

```js
B.Select({
  label:       'Thành phố',
  name:        'city',
  placeholder: '-- Chọn --',
  required:    true,
  multiple:    false,
  options: [
    { label: 'Hà Nội',      value: 'hanoi' },
    { label: 'Hồ Chí Minh', value: 'hcm'   }
  ]
})
```

**Options tải động** — dùng `sourceId` thay cho `options`:

```js
B.Select({
  label:    'Công ty',
  name:     'company',
  sourceId: 'company_source',
  required: true
})
```

> Cần khai báo `loadOptions` khi khởi tạo `FormRenderer`.

| Field | Mặc định |
|-------|:--------:|
| `label` | `'New Select'` |
| `name` | auto-generated |
| `placeholder` | `'Select an option'` |
| `options` | 2 options mặc định |
| `multiple` | `false` (bỏ qua nếu không dùng) |
| `sourceId` | _(bỏ qua nếu không dùng)_ |

---

### Checkbox

```js
B.Checkbox({
  label:    'Điều khoản',
  name:     'terms',
  required: true,
  options: [
    { label: 'Tôi đồng ý với điều khoản sử dụng.', value: '1' },
    { label: 'Tôi đã đủ 18 tuổi.', value: '2' }
  ]
})
```

`getValues()` của FormRenderer trả về mảng các `value` được check: `["1", "2"]`.

---

### Radio — Dạng đơn giản

```js
B.Radio({
  label:     'Giới tính',
  name:      'gender',
  radioType: 'option',
  required:  true,
  options: [
    { label: 'Nam', value: 'male' },
    { label: 'Nữ', value: 'female' }
  ]
})
```

---

### Radio — Kèm component con

Khi chọn một option, sub-components tương ứng hiển thị. Dùng `B.RadioOption()` để xây mỗi nhánh.

```js
B.Radio({
  label:     'Loại thành viên',
  name:      'member_type',
  required:  true,
  radioType: 'component',
  radioOptions: [
    B.RadioOption({
      label: 'Thành viên FPT',
      value: 'fpt',
      components: [
        B.Input({ label: 'Email FPT', name: 'fpt_email', required: true }),
        B.Select({
          label:    'Công ty',
          name:     'fpt_company',
          options:  ['FPT Software', 'FPT Telecom', 'FPT Education']
        })
      ]
    }),
    B.RadioOption({
      label: 'Đối tác',
      value: 'partner',
      components: [
        B.Select({ label: 'Loại đối tác', name: 'partner_type', options: ['Doanh nghiệp', 'Cá nhân'] })
      ]
    }),
    B.RadioOption({ label: 'Khác', value: 'other' })
  ]
})
```

> `value` trong `RadioOption` là giá trị mà `getValues()` trả về khi option đó được chọn. Mặc định bằng `label` nếu bỏ qua.

---

### RadioOption

Helper tạo một nhánh trong Radio component.

```js
B.RadioOption({
  label:      'Thành viên FPT',
  value:      'fpt',
  components: [ B.Input({…}), B.Select({…}) ]
})
```

| Field | Mặc định |
|-------|:--------:|
| `label` | `''` |
| `value` | bằng `label` nếu bỏ qua |
| `components` | `[]` |

---

### Text

```js
B.Text({
  content:  'Vui lòng điền đầy đủ thông tin bên dưới.',
  textType: 'p'
})
```

`textType` nhận bất kỳ HTML tag: `p`, `h1`–`h4`, `div`, `span`.

---

### HTML

```js
B.HTML({
  content: 'Liên hệ: <a href="tel:1900633003">1900633003</a>'
})
```

> Chỉ dùng với nội dung tin cậy — FormRenderer không escape HTML.

---

## 6. Xuất JSON

```js
// Plain object — dùng trực tiếp với FormRenderer:
var obj = schema.toJSON();
// {
//   title: '...', key_name: '...', description: '...', enabled: true,
//   boxes: [ { id: 'box_1', title: '...', rows: [...] } ]
// }

// Chuỗi JSON đẹp — dùng để lưu DB hoặc debug:
var str = schema.toString();

// Truyền vào FormRenderer (chỉ cần phần boxes):
var renderer = new FormRenderer({
  container: '#my-form',
  data: schema.toJSON().boxes
});
renderer.render();
```

---

## 7. Parse JSON có sẵn

Dùng `B.parse()` để tải schema từ server (hoặc DB) về lại instance `FormSchema` để sửa/tái sử dụng.

```js
// Nhận từ API
var savedJSON = { title: '...', boxes: [...] };

var schema = B.parse(savedJSON);
schema.title = 'Updated Title';

// Thêm box mới vào schema đã tải
var newBox = schema.addBox('Thêm mới');
newBox.addRow(B.Input({ label: 'Số điện thoại', name: 'phone' }));

console.log(schema.toString());
```

`parse()` xử lý cả 3 định dạng lịch sử:

| Định dạng | Mô tả |
|-----------|-------|
| `{ boxes, title, … }` | Format hiện tại (multi-box) |
| `{ rows, title, … }` | Format cũ (single-box) |
| `[comp, comp, …]` | Raw array (oldest) |

---

## 8. Options `{label, value}`

Tất cả `options` trong Select / Checkbox / Radio đều chấp nhận cả 2 dạng:

```js
// Dạng object (khuyến nghị)
options: [
  { label: 'Hà Nội', value: 'hanoi' },
  { label: 'TP.HCM', value: 'hcm'   }
]

// Dạng string (tự map label = value)
options: ['FPT Software', 'FPT Telecom', 'FPT Education']
```

`B.normalizeOptions(arr)` luôn trả về `{ label, value }[]`.

---

## 9. Sử dụng với FormRenderer

```html
<script src="form-builder.js"></script>
<script src="form-renderer.js"></script>
```

```js
var B = FormSchemaBuilder;

var schema = new B.FormSchema({ title: 'Đăng ký' });
var box = schema.addBox('Thông tin');
box.addRow(B.Input({ label: 'Họ tên', name: 'name', required: true }));
box.addRow(B.Select({ label: 'Cự ly', name: 'distance', options: [...] }));

var renderer = new FormRenderer({
  container: '#form',
  data: schema.toJSON().boxes,
  onSubmit: function(values) {
    // values = { name: '...', distance: '...' }
    console.log(values);
  }
});
renderer.render();
```

---

## 10. Schema mẫu đầy đủ

```js
var B = FormSchemaBuilder;

var schema = new B.FormSchema({
  title:       'Form mẫu vRace',
  key_name:    'sample_form',
  description: 'Ví dụ đầy đủ các component',
  enabled:     true
});

// ── Box 1 ──
var box1 = schema.addBox('Thông tin cá nhân');

box1.addRow(B.Text({ content: 'Điền thông tin cá nhân bên dưới.', textType: 'p' }));

box1.addRow(
  B.Input({ label: 'Họ', name: 'last_name', required: true }),
  B.Input({ label: 'Tên', name: 'first_name', required: true })
);

box1.addRow(B.Input({
  label:       'Email',
  name:        'email',
  placeholder: 'example@email.com',
  required:    true
}));

box1.addRow(B.Select({
  label:    'Thành phố',
  name:     'city',
  required: true,
  options: [
    { label: 'Hà Nội',      value: 'hanoi' },
    { label: 'Hồ Chí Minh', value: 'hcm'   },
    { label: 'Đà Nẵng',     value: 'danang' }
  ]
}));

// ── Box 2 ──
var box2 = schema.addBox('Loại thành viên');

box2.addRow(B.Radio({
  label:     'Bạn là',
  name:      'member_type',
  required:  true,
  radioType: 'component',
  radioOptions: [
    B.RadioOption({
      label: 'Thành viên FPT',
      value: 'fpt',
      components: [
        B.Input({ label: 'Email công ty', name: 'work_email', required: true }),
        B.Select({
          label:    'Đơn vị',
          name:     'fpt_unit',
          sourceId: 'fpt_units_source'
        })
      ]
    }),
    B.RadioOption({ label: 'Runner tự do', value: 'free' })
  ]
}));

// ── Box 3 ──
var box3 = schema.addBox('Điều khoản');

box3.addRow(B.Checkbox({
  label:    'Xác nhận',
  name:     'terms',
  required: true,
  options: [
    { label: 'Tôi xác nhận đã đủ 18 tuổi.', value: '1' },
    { label: 'Tôi đồng ý với Điều Khoản Sử Dụng.', value: '2' }
  ]
}));

box3.addRow(B.HTML({
  content: 'Cần hỗ trợ? Gọi <a href="tel:1900633003">1900633003</a>.'
}));

console.log(schema.toString());
```
