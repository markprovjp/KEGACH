"use client";

import { DownloadOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Space, Upload } from "antd";
import type { UploadProps } from "antd";
import { exportCsv, parseCsv, readTextFile, type CsvRow } from "@/lib/csv";

type ImportExportButtonsProps = {
  filename: string;
  rows: CsvRow[];
  onImport: (rows: CsvRow[]) => Promise<void> | void;
};

export function ImportExportButtons({ filename, rows, onImport }: ImportExportButtonsProps) {
  const uploadProps: UploadProps = {
    accept: ".csv,.txt",
    showUploadList: false,
    beforeUpload: async (file) => {
      const text = await readTextFile(file);
      await onImport(parseCsv(text));
      return false;
    }
  };

  return (
    <Space.Compact>
      <Button icon={<DownloadOutlined />} onClick={() => exportCsv(filename, rows)}>
        Xuất Excel
      </Button>
      <Upload {...uploadProps}>
        <Button icon={<UploadOutlined />}>Nhập Excel</Button>
      </Upload>
    </Space.Compact>
  );
}
