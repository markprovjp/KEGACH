"use client";

import { Card, Progress, Typography } from "antd";
import { orderStatusStats, revenueByDay } from "@/lib/sample-data";

const maxRevenue = Math.max(...revenueByDay.map((item) => item.value));

export function OperationsCharts() {
  return (
    <div className="chart-grid">
      <Card title="Doanh thu/COD theo ngày">
        <div className="bar-chart" aria-label="Biểu đồ doanh thu theo ngày">
          {revenueByDay.map((item) => (
            <div key={item.label} className="bar-item">
              <div className="bar-value">{Math.round(item.value / 1000)}K</div>
              <div className="bar-track">
                <div className="bar-fill" style={{ height: `${Math.max(12, (item.value / maxRevenue) * 100)}%` }} />
              </div>
              <div className="bar-label">{item.label}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Trạng thái vận hành">
        <div className="status-chart-list">
          {orderStatusStats.map((item) => (
            <div key={item.label}>
              <div className="card-line">
                <Typography.Text>{item.label}</Typography.Text>
                <Typography.Text strong>{item.value}</Typography.Text>
              </div>
              <Progress percent={Math.min(100, item.value * 12)} strokeColor={item.color} showInfo={false} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
