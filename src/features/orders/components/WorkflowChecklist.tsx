"use client";

import { Alert, Checkbox, Progress, Steps, Tag } from "antd";
import {
  getWorkflowDataMissing,
  getWorkflowMissing,
  getWorkflowMissingKeys,
  getWorkflowNextAction,
  getWorkflowPhaseState,
  getWorkflowRequiredKeys,
  normalizeWorkflowChecks,
  workflowPhaseChecks,
  workflowPhaseLabels,
  workflowCheckLabels,
  type WorkflowCheckKey,
  type WorkflowPhaseKey,
  type WorkflowOrderInput
} from "@/features/orders/order-workflow";

export function WorkflowChecklist({ order, value, onChange }: { order: WorkflowOrderInput; value?: string[]; onChange?: (value: WorkflowCheckKey[]) => void }) {
  const checked = normalizeWorkflowChecks(value);
  const required = getWorkflowRequiredKeys({ ...order, workflowChecks: checked });
  const missingKeys = getWorkflowMissingKeys({ ...order, workflowChecks: checked });
  const dataMissing = getWorkflowDataMissing({ ...order, workflowChecks: checked });
  const missing = getWorkflowMissing({ ...order, workflowChecks: checked });
  const phaseState = getWorkflowPhaseState({ ...order, workflowChecks: checked });
  const nextAction = getWorkflowNextAction({ ...order, workflowChecks: checked });
  const allKeys = Array.from(new Set<WorkflowCheckKey>([...required, ...checked]));
  const percent = required.length ? Math.round(((required.length - missingKeys.length) / required.length) * 100) : dataMissing.length ? 0 : 100;
  const firstMissingPhase = phaseState.findIndex((phase) => phase.required > 0 && phase.missing > 0);
  const currentPhase = firstMissingPhase === -1 ? phaseState.length - 1 : firstMissingPhase;

  function toggleCheck(key: WorkflowCheckKey, enabled: boolean) {
    const next = enabled ? [...checked, key] : checked.filter((item) => item !== key);
    onChange?.(normalizeWorkflowChecks(next));
  }

  return (
    <div className="workflow-panel">
      <div className="card-line">
        <b>Checklist quy trình</b>
        <Tag color={missing.length ? "red" : "green"}>{missing.length ? `Thiếu ${missing.length}` : "Đủ"}</Tag>
      </div>
      <Progress percent={percent} size="small" />
      <Steps
        className="workflow-steps"
        size="small"
        current={currentPhase}
        items={phaseState.map((phase) => ({
          title: phase.title,
          content: phase.required ? `${phase.completed}/${phase.required}` : "Chưa cần",
          status: phase.required === 0 ? "wait" : phase.missing ? "process" : "finish"
        }))}
      />
      {missing.length ? (
        <Alert
          type={nextAction.severity === "blocked" ? "error" : "warning"}
          showIcon
          title={`Việc cần làm ngay: ${nextAction.title}`}
          description={`Nhóm: ${nextAction.phase}. Các việc còn thiếu: ${missing.slice(0, 6).join(" • ")}`}
          style={{ margin: "8px 0" }}
        />
      ) : null}
      <div className="workflow-phase-grid">
        {(Object.keys(workflowPhaseLabels) as WorkflowPhaseKey[]).map((phase) => {
          const phaseKeys = workflowPhaseChecks[phase].filter((key) => allKeys.includes(key));
          if (!phaseKeys.length) return null;
          return (
            <div key={phase} className="workflow-phase-box">
              <b>{workflowPhaseLabels[phase]}</b>
              {phaseKeys.map((key) => (
                <Checkbox key={key} className="workflow-checkbox" checked={checked.includes(key)} onChange={(event) => toggleCheck(key, event.target.checked)}>
                  {workflowCheckLabels[key]}
                </Checkbox>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
