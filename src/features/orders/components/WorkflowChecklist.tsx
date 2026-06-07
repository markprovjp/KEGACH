"use client";

import { Alert, Checkbox, Progress, Tag } from "antd";
import {
  getWorkflowMissing,
  getWorkflowRequiredKeys,
  normalizeWorkflowChecks,
  workflowCheckLabels,
  type WorkflowCheckKey,
  type WorkflowOrderInput
} from "@/features/orders/order-workflow";

export function WorkflowChecklist({ order, value, onChange }: { order: WorkflowOrderInput; value?: string[]; onChange?: (value: WorkflowCheckKey[]) => void }) {
  const checked = normalizeWorkflowChecks(value);
  const required = getWorkflowRequiredKeys({ ...order, workflowChecks: checked });
  const missing = getWorkflowMissing({ ...order, workflowChecks: checked });
  const allKeys = Array.from(new Set<WorkflowCheckKey>([...required, ...checked]));
  const percent = required.length ? Math.round(((required.length - missing.filter((item) => required.some((key) => workflowCheckLabels[key] === item)).length) / required.length) * 100) : 100;

  return (
    <div className="workflow-panel">
      <div className="card-line">
        <b>Checklist quy trình</b>
        <Tag color={missing.length ? "red" : "green"}>{missing.length ? `Thiếu ${missing.length}` : "Đủ"}</Tag>
      </div>
      <Progress percent={percent} size="small" />
      {missing.length ? <Alert type="warning" showIcon title="Chưa đủ quy trình" description={missing.slice(0, 6).join(" • ")} style={{ margin: "8px 0" }} /> : null}
      <Checkbox.Group
        className="workflow-check-grid"
        value={checked}
        options={allKeys.map((key) => ({ value: key, label: workflowCheckLabels[key] }))}
        onChange={(next) => onChange?.(normalizeWorkflowChecks(next))}
      />
    </div>
  );
}
