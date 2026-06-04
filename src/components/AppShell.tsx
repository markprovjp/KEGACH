"use client";

import {
  AppstoreOutlined,
  AuditOutlined,
  CarOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  PlusCircleOutlined
} from "@ant-design/icons";
import { Layout, Menu, Typography } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: "/", icon: <DashboardOutlined />, label: <Link href="/">Tổng quan</Link> },
  { key: "/orders/new", icon: <PlusCircleOutlined />, label: <Link href="/orders/new">Tạo đơn</Link> },
  { key: "/board", icon: <AppstoreOutlined />, label: <Link href="/board">Kanban</Link> },
  { key: "/inventory", icon: <DatabaseOutlined />, label: <Link href="/inventory">Kho</Link> },
  { key: "/reconciliation", icon: <AuditOutlined />, label: <Link href="/reconciliation">Đối soát</Link> },
  { key: "/dispatch", icon: <CarOutlined />, label: <Link href="/dispatch">Điều xe</Link> }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const selectedKey = menuItems.some((item) => item.key === pathname) ? pathname : "/";

  return (
    <Layout className="page-shell">
      <Sider width={236} theme="light">
        <div style={{ padding: 18 }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            KeGach Ops
          </Typography.Title>
          <Typography.Text type="secondary">Kiot là sổ cái, app là vận hành</Typography.Text>
        </div>
        <Menu mode="inline" selectedKeys={[selectedKey]} items={menuItems} />
      </Sider>
      <Layout>
        <Header style={{ background: "#fff", borderBottom: "1px solid #e4e7ec", height: 56, padding: "0 20px" }}>
          <Typography.Text strong>Long Hải Plastic Operations</Typography.Text>
        </Header>
        <Content className="content-shell">{children}</Content>
      </Layout>
    </Layout>
  );
}
