"use client";

import { SettingOutlined } from "@ant-design/icons";
import { Button, Checkbox, Dropdown, Space } from "antd";

export type ColumnVisibilityOption<T extends string> = {
  key: T;
  label: string;
  required?: boolean;
};

export function ColumnVisibilityDropdown<T extends string>({
  options,
  value,
  onChange
}: {
  options: ColumnVisibilityOption<T>[];
  value: T[];
  onChange: (next: T[]) => void;
}) {
  const selected = new Set(value);
  const allKeys = options.map((option) => option.key);
  const optionalKeys = options.filter((option) => !option.required).map((option) => option.key);
  const visibleOptionalCount = optionalKeys.filter((key) => selected.has(key)).length;

  function setKey(key: T, checked: boolean) {
    const next = new Set(value);
    if (checked) next.add(key);
    else next.delete(key);
    onChange(allKeys.filter((item) => next.has(item)));
  }

  return (
    <Dropdown
      trigger={["click"]}
      placement="bottomRight"
      popupRender={() => (
        <div className="column-visibility-menu">
          <Space direction="vertical" size={6}>
            <Checkbox
              checked={visibleOptionalCount === optionalKeys.length}
              indeterminate={visibleOptionalCount > 0 && visibleOptionalCount < optionalKeys.length}
              onChange={(event) => {
                const next = new Set(value);
                for (const key of optionalKeys) {
                  if (event.target.checked) next.add(key);
                  else next.delete(key);
                }
                onChange(allKeys.filter((item) => next.has(item)));
              }}
            >
              Hiện tất cả cột phụ
            </Checkbox>
            <div className="column-visibility-list">
              {options.map((option) => (
                <Checkbox
                  key={option.key}
                  checked={selected.has(option.key)}
                  disabled={option.required}
                  onChange={(event) => setKey(option.key, event.target.checked)}
                >
                  {option.label}
                </Checkbox>
              ))}
            </div>
          </Space>
        </div>
      )}
    >
      <Button icon={<SettingOutlined />}>Cột hiển thị</Button>
    </Dropdown>
  );
}
